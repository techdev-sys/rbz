import glob
import re

files = glob.glob("/home/takilaa/rbz/rbz-frontend/src/components/*.js")
pattern_import = re.compile(r"import\s+WorkflowStatusPanel\s+from\s+[\x27\x22]\./WorkflowStatusPanel[\x27\x22];?\n?")
pattern_tag_multi = re.compile(r"<div[^>]*>\s*<\s*WorkflowStatusPanel[^>]*/>\s*</div>", re.DOTALL)
pattern_tag = re.compile(r"<\s*WorkflowStatusPanel[^>]*/>", re.DOTALL)
pattern_comment = re.compile(r"\{\s*/\*\s*Workflow\s*Status\s*Panel\s*\*/\s*\}", re.DOTALL)

for fpath in files:
    # Skip these explicitly
    if fpath.endswith("Stage9DocumentsUpload.js") or fpath.endswith("ReportGeneration.js") or fpath.endswith("App.js") or fpath.endswith("DashboardSenior.js") or fpath.endswith("ReviewControlPanel.js") or fpath.endswith("WorkflowStatusPanel.js"):
        continue

    try:
        with open(fpath, "r") as f:
            content = f.read()

        # fix the ```javascript that was accidentally placed at line 1 in CompanyProfile.js
        if content.startswith("```javascript\n"):
            content = content.replace("```javascript\n", "", 1)

        new_content = pattern_import.sub("", content)
        new_content = pattern_tag_multi.sub("", new_content)
        new_content = pattern_tag.sub("", new_content)
        new_content = pattern_comment.sub("", new_content)

        if content != new_content:
            with open(fpath, "w") as f:
                f.write(new_content)
            print("Successfully processed", fpath)
    except Exception as e:
        print("Error processing", fpath, str(e))
