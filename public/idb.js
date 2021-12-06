
let db;


const request = indexedDB.open("budget_tracker", 1);


request.onupgradeneeded = function (event) {
    console.log("Upgrade needed in IndexDB");

    const { oldVersion } = event;
    const newVersion = event.newVersion || db.version;

    console.log(`DB updated from version ${oldVersion} to ${newVersion}`);


    db = event.target.result;


    if (db.objectStoreNames.length === 0) {

        db.createObjectStore("BudgetStore", { autoIncrement: true });
    }
};

request.onerror = function (event) {
    console.log(`Error: ${event.target.errorCode}`);
};


request.onsuccess = function (event) {

    db = event.target.result;


    if (navigator.onLine) {
        console.log("Backend online!");
        syncDatabase();
    }
};


function saveRecord(record) {



    const transaction = db.transaction(["BudgetStore"], "readwrite");


    const store = transaction.objectStore("BudgetStore");


    store.add(record);
}


function syncDatabase() {
    console.log("check db invoked");


    let transaction = db.transaction(["BudgetStore"], "readwrite");


    const store = transaction.objectStore("BudgetStore");


    const getAll = store.getAll();


    getAll.onsuccess = function () {

        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain. */*",
                    "Content-Type": "application/json",
                },
            })
                .then((response) => response.json())
                .then((res) => {

                    if (res.length !== 0) {

                        transaction = db.transaction(["BudgetStore"], "readwrite");


                        const currentStore = transaction.objectStore("BudgetStore");


                        currentStore.clear();
                        console.log("Clearing Store");
                    }
                });
        }
    };
}


window.addEventListener("online", syncDatabase);