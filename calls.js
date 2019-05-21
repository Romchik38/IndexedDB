const calls = {};
calls.db = '';
calls.openDB = '';
calls.add = {}                      //Добавляем в базу
calls.goLive = '';                  //Функция запуска базы

const btnSave = document.querySelector('#btnSave'),             //Кнопка сохранения новой записи
    inpNumber = document.querySelector('#inpNumber'),           //Поле ввода номера
    inpTime = document.querySelector('#inpTime'),               //Поле ввода времени
    tableWork = document.querySelector('#tableWork'),           //Необработанные отображаем или скрываем
    tableBody = document.querySelector('#tableBody'),           //необработанные вывод информации
    selectDone = document.querySelector('#selectDone'),         //выпадающий список
    tableAll = document.querySelector('#tableAll'),             //все отображаем или скрываем
    tableBodyAll = document.querySelector('#tableBodyAll'),     //все вывод информации
    checkAll = document.querySelector('#checkAll'),             //Разрешить показывать все
    lbDeleteAll = document.querySelector('#lbDeleteAll'),
    btnDeleteAll = document.querySelector('#btnDeleteAll');


window.addEventListener('DOMContentLoaded', () => {
    calls.goLive('read')
})

calls.goLive = (event, data) => {
    //Проверка на существование indexedDB
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    if (!window.indexedDB) {
        window.alert("Ваш браузер не поддерживат стабильную версию IndexedDB. Такие-то функции будут недоступны");
        return;
    }
    //Открытие базы данных
    calls.openDB = indexedDB.open("Calls", 1);
    //Создание базы если ее еще нет
    calls.openDB.onupgradeneeded = (e) => {
        console.log('запуск onupgradeneeded');
        calls.db = e.target.result;
        calls.objectStore = calls.db.createObjectStore(
            'Calls', { keyPath: "id", autoIncrement: true });
        calls.objectStore.createIndex('number', 'number', { unique: false });
        calls.objectStore.createIndex('time', 'time', { unique: false });
        calls.objectStore.createIndex('description', 'description', { unique: false });
        calls.objectStore.createIndex('result', 'result', { unique: false });
    }
    calls.openDB.onerror = (e) => {
        console.log(`Ошибка открытия базы данных: ${e.target.errorCode}`)
    }
    calls.openDB.onsuccess = (e) => {
        calls.db = e.target.result;
        //Все ошибки с базой будут выводиться так
        calls.db.onerror = (e) => {
            console.log(`Ошибка работы с базой данных: " ${e.target.errorCode}`)
        }
        //Работа с данными данных
        if (!event) {
            calls.db.close();
            return;
        }
        calls.transaction = calls.db.transaction(["Calls"], "readwrite");
        calls.transaction.oncomplete = (e) => {
        }
        calls.transaction.onerror = (e) => {
            console.log(`Ошибка транзакции : ${e.target.error}`)
        }
        calls.objectStore = calls.transaction.objectStore('Calls');
        //Если добавление
        if (event == 'add') {
            let request = calls.objectStore.add(data)
            request.onsuccess = (e) => {
                inpNumber.value = '';
                inpTime.value = '';
            }
            request.onerror = (e) => {
                console.log(`Ошибка добавления данных: ${e.target.errorCode}`)
            }
        }
        //Если запись
        if (event == 'write') {
            let request = calls.objectStore.put(data)
            request.onsuccess = (e) => {
                deleteTr(data.id, 'tableWork')
            }
            request.onerror = (e) => {
                console.log(`Ошибка записи данных: ${e.target.errorCode}`)
            }
        }
        //Если чтение
        if (event == 'read') {
            let arr = [];               //массив необработанных данных
            let arrAll = [];            //массив всех данных, в т.ч. необработанных
            calls.objectStore.openCursor(null, 'prev').onsuccess = (e) => {         //Выборка делается в обратном порядке
                let cursor = e.target.result;
                if (cursor) {
                    if (cursor.key) {
                        let tempObj = {
                            key: cursor.key,
                            number: cursor.value.number,
                            time: cursor.value.time,
                            description: cursor.value.description,
                            result: cursor.value.result
                        }
                        arrAll.push(tempObj);       //Добавляются любые данные

                        if (cursor.value.result == undefined) {
                            arr.push(tempObj)      //Добавляются необработанные данные
                        }
                    }
                    cursor.continue();
                }
                else {
                    //Для необработанных
                    if (arr.length > 0) {
                        arr.forEach(element => {
                            deleteTr(element.key, 'tableWork')
                        });
                        createTable(arr, 'tableWork');       //передача данных для отрисовки необработанных звонков
                        tableWork.style.display = 'block'
                    } else {
                        tableWork.style.display = 'none'
                    }
                    //Для всех
                    if (arrAll.length > 0) {
                        arrAll.forEach(element => {
                            deleteTr(element.key, 'tableAll')
                        });
                        createTable(arrAll, 'tableAll');       //передача данных для отрисовки всех
                    }
                }
            }
        }   //Конец чтения
        //Если удаление
        if (event == 'delete') {
            let clear = calls.objectStore.clear();
            clear.onsuccess = (e) => {
                deleteRowsAfterCelar()
            }
            clear.onerror = (e) => {
                console.log(e.target.errorCode)
            }
        }   //Конец удаления
        //Конец работы с данными
    }
}

//Нажатие на кнопку Сохранить
btnSave.addEventListener('click', () => {
    if (inpNumber.value.length == 0 || inpTime.value.length == 0) return;
    (async function fn() {
        await calls.goLive('add', {
            number: inpNumber.value,
            time: inpTime.value
        });
        await calls.goLive('read');
    })();
})

//Отрисовка таблиц
createTable = (arr, table) => {
    arr.forEach(element => {
        let tableTr, tableTd, tableDescription, divResult, selectResult, optionResult;
        let obj = {}
        obj.id = element.key;
        tableTr = document.createElement('tr');
        if (table == 'tableWork') {
            tableTr.setAttribute('id', `tr${element.key}`)
        } else if (table == 'tableAll') {
            tableTr.setAttribute('id', `trAll${element.key}`)
        }
        //Номер
        tableTd = document.createElement('td');
        tableTd.classList.add('align-middle');
        tableTd.innerText = element.number;
        tableTr.appendChild(tableTd);
        obj.number = element.number;
        //Время
        tableTd = document.createElement('td');
        tableTd.classList.add('align-middle');
        if (element.time != undefined) {
            tableTd.innerText = element.time
        }
        tableTr.appendChild(tableTd);
        obj.time = element.time;
        //Описание
        tableDescription = document.createElement('td');
        tableDescription.classList.add('text-left');
        //tableDescription.setAttribute('contenteditable', 'true');
        tableDescription.style.width = '40%';
        tableDescription.name = 'tableDescription';
        // if (element.description != undefined) {
        //     tableDescription.innerText = element.description
        // }
        tableTr.appendChild(tableDescription);
        obj.description = element.description;
        spanDescription = document.createElement('div');
        spanDescription.setAttribute('contenteditable', 'true');
        spanDescription.name = 'spanDescription';
        spanDescription.style.display = 'block';
        spanDescription.style.width = '100%';
        spanDescription.style.backgroundColor = 'lightred';
        if (element.description != undefined) {
            spanDescription.innerText = element.description;
        } else {
            spanDescription.innerText = '... редактировать';
        }
        tableDescription.appendChild(spanDescription);
        //Результат
        tableTd = document.createElement('td');
        tableTd.classList.add('align-middle');
        divResult = document.createElement('div');          //Добавлен div
        divResult.classList.add('form-group');
        tableTd.appendChild(divResult);
        if (table == 'tableWork') {
            selectResult = document.createElement('select');    //Добавлен select
            selectResult.classList.add('form-control');
            selectResult.setAttribute('name', 'selectDone');
            divResult.appendChild(selectResult);
            optionResult = document.createElement('option')     //Добавлен option Отметить
            optionResult.setAttribute('selected', 'true');
            optionResult.setAttribute('disabled', 'true');
            optionResult.innerText = 'Отметить';
            selectResult.appendChild(optionResult);
            optionResult = document.createElement('option')     //Добавлен option Новый заказ
            optionResult.innerText = 'Новый заказ';
            selectResult.appendChild(optionResult);
            optionResult = document.createElement('option')     //Добавлен option Интересовались товаром
            optionResult.innerText = 'Интересовались товаром';
            selectResult.appendChild(optionResult);
            optionResult = document.createElement('option')     //Добавлен option Ничего не вышло
            optionResult.innerText = 'Ничего не вышло';
            selectResult.appendChild(optionResult);
        } else if (table == 'tableAll') {
            if (element.result != undefined) {
                divResult.innerText = element.result
            }
        }
        tableTd.style.width = '20%';
        tableTr.appendChild(tableTd);
        if (table == 'tableWork') {        //Работаем только с элементами где нет result
            tableBody.appendChild(tableTr);
            сhange(selectResult, obj);
            сhange(spanDescription, obj);
        }
        if (table == 'tableAll') {
            tableBodyAll.appendChild(tableTr);
            spanDescription.setAttribute('contenteditable', 'false');
        }
    });
}

//При изменение результата или описания
сhange = (selectResult, obj) => {
    //установка change на изменение result
    if (selectResult.name == 'selectDone') {
        selectResult.addEventListener('change', (e) => {
            obj.result = e.target.value;
            (async function fnres() {
                await calls.goLive('write', obj);
                await calls.goLive('read');
            })();
        })
    }
    //Установка blur на description
    else if (selectResult.name == 'spanDescription') {
        selectResult.addEventListener('blur', (e) => {
            if (selectResult.innerText.length == 0 ) {
                selectResult.innerText = '... редактировать';
            } else if (selectResult.innerText.length == 1 && selectResult.innerText.charCodeAt(0) == 10) {
                selectResult.innerText = '... редактировать';
            };
            obj.description = e.target.innerText;
            (async function fn() {
                await calls.goLive('write', obj);
                await calls.goLive('read');
            })();
        })
        //При фокусировке
        selectResult.addEventListener('focus', (e) => {
            if (selectResult.innerText == '... редактировать') {
                selectResult.innerText = '';
            }
        })

    }
}
//удаление строк в таблице необработанных звонков
deleteTr = (id, table) => {
    let trDel;
    if (table == 'tableWork') {
        trDel = document.querySelector(`#tr${id}`);
        if (trDel) {
            trDel.remove()
        }
    } else if (table == 'tableAll') {
        trDel = document.querySelector(`#trAll${id}`);
        if (trDel) {
            trDel.remove()
        }
    }
}
//Нажатие на флажок Показать все
checkAll.addEventListener('click', (e) => {
    if (e.target.checked === true) {
        tableAll.style.display = 'block'
    } else {
        tableAll.style.display = 'none'
    }

})

lbDeleteAll.addEventListener('mouseover', (e) => {
    btnDeleteAll.style.visibility = 'visible';
    setTimeout(() => {
        btnDeleteAll.style.visibility = 'hidden'
    }, 10000);
})

btnDeleteAll.addEventListener('click', (e) => {
    calls.goLive('delete');
})

//Удалить все строки в таблицах после очистки базы
deleteRowsAfterCelar = () => {
    allTr = document.querySelectorAll('tr');
    allTr.forEach(element => {
        if (element.id) {
            element.remove()
        }
    });
    tableWork.style.display = 'none';
    tableAll.style.display = 'none';
    checkAll.checked = false;
}