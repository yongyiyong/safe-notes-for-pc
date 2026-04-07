class Helper {
    constructor() {
        this.about = "";
        this.manual = "";
    }

    async load() {
        this.about = await pywebview.api.helper.about() || this.about;
        this.manual = await pywebview.api.helper.manual() || this.manual;
    }

    setAbout() {
        document.getElementById("safeNotesAbout").innerHTML = safeMarkedParse(this.about);
    }

    setManual() {
        document.getElementById("safeNotesManual").innerHTML = safeMarkedParse(this.manual);
    }
}