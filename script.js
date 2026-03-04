 /* ================= RUN CODE ================= */

function runCode() {

    const code = window.editor.getValue();
    const language = document.getElementById("language").value;
    const input = document.getElementById("inputBox").value;

    const terminal = document.getElementById("terminal");
    const iframe = document.getElementById("htmlPreview");

    terminal.innerText = "";

    /* 🔥 CLEAR OLD ERROR MARKERS */
    monaco.editor.setModelMarkers(
        window.editor.getModel(),
        "owner",
        []
    );

    /* ========= HTML PREVIEW ========= */

    if (language === "html") {

        terminal.style.display = "none";
        iframe.style.display = "block";

        const doc = iframe.contentDocument || iframe.contentWindow.document;

        doc.open();
        doc.write(code);
        doc.close();

        return;
    }

    iframe.style.display = "none";
    terminal.style.display = "block";

    terminal.innerText = "[ RUNNING... ]\n";

    fetch("/run", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            code: code,
            input: input,
            language: language
        })
    })
    .then(res => res.json())
    .then(data => {

        const output = data.output;

        terminal.innerText += output;
        terminal.innerText += "\n\n✔ Execution Time : " + data.time + " seconds";

        /* 🔥 ERROR LINE DETECT */

        const match = output.match(/line (\d+)/);

        if(match){

            const lineNumber = parseInt(match[1]);

            monaco.editor.setModelMarkers(
                window.editor.getModel(),
                "owner",
                [{
                    startLineNumber: lineNumber,
                    endLineNumber: lineNumber,
                    startColumn: 1,
                    endColumn: 100,
                    message: "Error here",
                    severity: monaco.MarkerSeverity.Error
                }]
            );

        }

        terminal.scrollTop = terminal.scrollHeight;

    })
    .catch(err => {

        terminal.innerText += "\nError: " + err;

    });

}


/* ================= LANGUAGE SWITCH ================= */

document.getElementById("language").addEventListener("change", function () {

    const lang = this.value;

    const map = {
        python: "python",
        c: "c",
        cpp: "cpp",
        java: "java",
        javascript: "javascript",
        html: "html"
    };

    monaco.editor.setModelLanguage(
        window.editor.getModel(),
        map[lang]
    );

    updateFileName();

});


/* ================= FILE NAME AUTO UPDATE ================= */

function updateFileName() {

    const language = document.getElementById("language").value;
    const code = window.editor.getValue();
    const fileBar = document.getElementById("filename");

    if (!fileBar) return;

    if (language === "java") {

        const match = code.match(/public\s+class\s+(\w+)/);

        if (match) {
            fileBar.innerText = match[1] + ".java";
        } else {
            fileBar.innerText = "Main.java";
        }

    }
    else if (language === "python") fileBar.innerText = "main.py";
    else if (language === "c") fileBar.innerText = "main.c";
    else if (language === "cpp") fileBar.innerText = "main.cpp";
    else if (language === "javascript") fileBar.innerText = "main.js";
    else if (language === "html") fileBar.innerText = "index.html";

}


/* ========= Update filename while typing ========= */

setTimeout(() => {

    if (window.editor) {

        window.editor.onDidChangeModelContent(function () {

            updateFileName();

        });

    }

}, 1000);


/* ================= CLEAR TERMINAL ================= */

function clearTerminal(){
    document.getElementById("terminal").innerText = "";
}


/* ================= CTRL + ENTER RUN ================= */

document.addEventListener("keydown", function(e){

    if(e.ctrlKey && e.key === "Enter"){
        runCode();
    }

});


/* ================= DOWNLOAD CODE ================= */

function downloadCode(){

    const code = window.editor.getValue();
    const language = document.getElementById("language").value;

    const extensions = {
        python:"py",
        c:"c",
        cpp:"cpp",
        java:"java",
        javascript:"js",
        html:"html"
    };

    const blob = new Blob([code], {type:"text/plain"});
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "code."+extensions[language];
    link.click();
}


/* ================= THEME TOGGLE ================= */

let currentTheme = "vs-dark";

function toggleTheme(){

    if(currentTheme === "vs-dark"){

        monaco.editor.setTheme("vs");
        currentTheme = "vs";

    } else {

        monaco.editor.setTheme("vs-dark");
        currentTheme = "vs-dark";

    }

}


/* ================= OPEN FILE ================= */

function openFile(e){

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(){

        const content = reader.result;
        window.editor.setValue(content);

        const name = file.name;
        const ext = name.split(".").pop();

        const languageSelect = document.getElementById("language");

        if(ext === "py") languageSelect.value = "python";
        else if(ext === "c") languageSelect.value = "c";
        else if(ext === "cpp") languageSelect.value = "cpp";
        else if(ext === "java") languageSelect.value = "java";
        else if(ext === "js") languageSelect.value = "javascript";
        else if(ext === "html") languageSelect.value = "html";

        const map = {
            python:"python",
            c:"c",
            cpp:"cpp",
            java:"java",
            javascript:"javascript",
            html:"html"
        };

        monaco.editor.setModelLanguage(
            window.editor.getModel(),
            map[languageSelect.value]
        );

    }

    reader.readAsText(file);
}

let files = {
    "main.py": ""
};

let currentFile = "main.py";


function createTab(){

    const name = prompt("Enter file name");

    if(!name) return;

    if(files[name]){
        alert("File already exists");
        return;
    }

    files[name] = "";

    const tab = document.createElement("div");
    tab.className = "tab";
    tab.innerText = name;
    tab.setAttribute("data-file", name);

    tab.onclick = () => switchTab(name);

    const tabs = document.getElementById("tabs");

    tabs.insertBefore(tab, document.querySelector(".add-tab"));

}


function switchTab(name){

    // save current file code
    files[currentFile] = window.editor.getValue();

    currentFile = name;

    // load new file code
    window.editor.setValue(files[name]);

    document.querySelectorAll(".tab").forEach(t=>{
        t.classList.remove("active");
    });

    document.querySelector(`[data-file="${name}"]`).classList.add("active");

}