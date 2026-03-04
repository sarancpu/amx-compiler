from flask import Flask, render_template, request, jsonify
import subprocess
import tempfile
import os
import re
import time

app = Flask(__name__, static_folder="static", template_folder="templates")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/run", methods=["POST"])
def run_code():

    data = request.get_json(force=True)
    code = data.get("code", "")
    user_input = data.get("input", "")
    language = data.get("language", "python")

    start_time = time.time()

    try:

        # ---------- PYTHON ----------
        if language == "python":

            with tempfile.NamedTemporaryFile(delete=False, suffix=".py") as f:
                f.write(code.encode())
                src = f.name

            r = subprocess.run(
                ["python3", src],
                input=user_input,
                capture_output=True,
                text=True,
                timeout=5
            )

            output = r.stdout + r.stderr
            os.remove(src)

        # ---------- C ----------
        elif language == "c":

            with tempfile.NamedTemporaryFile(delete=False, suffix=".c") as f:
                f.write(code.encode())
                src = f.name

            exe = src.replace(".c", "")

            compile_res = subprocess.run(
                ["gcc", src, "-o", exe],
                capture_output=True,
                text=True
            )

            if compile_res.returncode != 0:
                output = compile_res.stderr
            else:

                run_res = subprocess.run(
                    [exe],
                    input=user_input,
                    capture_output=True,
                    text=True,
                    timeout=5
                )

                output = run_res.stdout + run_res.stderr

            os.remove(src)
            if os.path.exists(exe):
                os.remove(exe)

        # ---------- C++ ----------
        elif language == "cpp":

            with tempfile.NamedTemporaryFile(delete=False, suffix=".cpp") as f:
                f.write(code.encode())
                src = f.name

            exe = src.replace(".cpp", "")

            compile_res = subprocess.run(
                ["g++", src, "-o", exe],
                capture_output=True,
                text=True
            )

            if compile_res.returncode != 0:
                output = compile_res.stderr
            else:

                run_res = subprocess.run(
                    [exe],
                    input=user_input,
                    capture_output=True,
                    text=True,
                    timeout=5
                )

                output = run_res.stdout + run_res.stderr

            os.remove(src)
            if os.path.exists(exe):
                os.remove(exe)

        # ---------- JAVA ----------
        elif language == "java":

            match = re.search(r'public\s+class\s+(\w+)', code)

            if match:
                class_name = match.group(1)
            else:
                class_name = "Main"

            with tempfile.TemporaryDirectory() as tmpdir:

                java_file = os.path.join(tmpdir, f"{class_name}.java")

                with open(java_file, "w") as f:
                    f.write(code)

                compile_res = subprocess.run(
                    ["javac", java_file],
                    capture_output=True,
                    text=True
                )

                if compile_res.returncode != 0:
                    output = compile_res.stderr
                else:

                    run_res = subprocess.run(
                        ["java", "-cp", tmpdir, class_name],
                        input=user_input,
                        capture_output=True,
                        text=True,
                        timeout=5
                    )

                    output = run_res.stdout + run_res.stderr

        # ---------- JAVASCRIPT ----------
        elif language == "javascript":

            with tempfile.NamedTemporaryFile(delete=False, suffix=".js") as f:
                f.write(code.encode())
                src = f.name

            r = subprocess.run(
                ["node", src],
                input=user_input,
                capture_output=True,
                text=True,
                timeout=5
            )

            output = r.stdout + r.stderr
            os.remove(src)

        else:
            output = "Unsupported language selected"

    except Exception as e:
        output = str(e)

    end_time = time.time()
    execution_time = round(end_time - start_time, 3)

    return jsonify({
        "output": output,
        "time": execution_time
    })


# Render production run
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
