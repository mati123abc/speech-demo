class CaptionEngine {
    constructor() {
        this.glossary = new Map();

        // 1. Domain glossary mặc định (công trường)
        this.loadDefaultGlossary();

        this.context = "GENERAL";
        this.lastText = "";
        this.lastTime = 0;
    }

    // =========================
    // 1. TEXT STABILIZER
    // =========================
    stabilize(text) {
        if (!text) return "";

        const now = Date.now();

        // bỏ text quá ngắn / rác
        if (text.length <= 1) return "";

        // tránh lặp
        if (text === this.lastText) return "";

        this.lastText = text;
        this.lastTime = now;

        return text;
    }

    // =========================
    // 2. NOISE CLEANER
    // =========================
    cleanNoise(text) {
        if (!text) return "";

        return text
            .replace(/[.,!?]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    // =========================
    // 3. DOMAIN GLOSSARY ENGINE
    // =========================
    applyGlossary(text) {
        let result = text;

        for (const [wrong, correct] of this.glossary.entries()) {
            result = result.replaceAll(wrong, correct);
        }

        return result;
    }

    loadDefaultGlossary() {
        const base = [
            ["소액농", "통행로"],
            ["러티비", "TBM"],
            ["텔레비트볼", "엘리베이터홀"],
            ["안전구금", "안전구호"],
            ["화제", "화재"],
            ["안전국", "안전구호"],
            ["인테넷", "인원"]
        ];

        for (const [k, v] of base) {
            this.glossary.set(k, v);
        }
    }

    // =========================
    // 4. CONTEXT DETECTOR
    // =========================
    detectContext(text) {
        if (!text) return "GENERAL";

        const tbmKeywords = ["TBM", "안전", "점검", "작업", "현장"];
        const safetyKeywords = ["위험", "추락", "화재", "감전"];

        let tbmScore = 0;
        let safetyScore = 0;

        for (const k of tbmKeywords) {
            if (text.includes(k)) tbmScore++;
        }

        for (const k of safetyKeywords) {
            if (text.includes(k)) safetyScore++;
        }

        if (tbmScore >= 2) return "TBM";
        if (safetyScore >= 1) return "SAFETY";

        return "GENERAL";
    }

    // =========================
    // 5. MAIN PIPELINE
    // =========================
    process(text) {
        let t = text;

        // 1. stabilize
        t = this.stabilize(t);
        if (!t) return "";

        // 2. noise clean
        t = this.cleanNoise(t);

        // 3. glossary
        t = this.applyGlossary(t);

        // 4. context detect
        this.context = this.detectContext(t);

        return t;
    }
}

// Hỗ trợ cả Node.js (require) và browser (<script src="captionEngine.js">)
if (typeof module !== "undefined" && module.exports) {
    module.exports = CaptionEngine;
}