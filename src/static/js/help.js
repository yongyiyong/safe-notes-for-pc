class Helper {
    constructor() {
        this.version = "1.0.0";
        this.about = "";
        this.manual = "";
    }

    async load() {
        this.version = await pywebview.api.helper.version() || this.version;
        this.about = await pywebview.api.helper.about() || this.about;
        this.manual = await pywebview.api.helper.manual() || this.manual;

        document.getElementById("safeNotesVersion").innerText = this.version;
    }
}