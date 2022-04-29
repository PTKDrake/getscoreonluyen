"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json()); // for parsing application/json
app.use(express_1.default.urlencoded({ extended: true }));
let port = process.env.PORT || 3000;
app.set('views', './views'); // Thư mục views nằm cùng cấp với file app.js
app.set('view engine', 'pug');
const router = express_1.default.Router();
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});
app.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let email = req.body.email;
    let password = req.body.password;
    try {
        const account = yield login(email, password);
        if (!account)
            res.send('Tài khoản không hợp lệ!');
        else {
            const name = account.name;
            const token = account.token;
            let exams = yield getListExam(token);
            if (exams.length === 0)
                res.send('Bạn hiện không có kì thi nào.');
            else {
                for (const exam of exams) {
                    exam.tests = [];
                    const tests = yield getTests(token, exam.id);
                    for (const test of tests) {
                        const testInfo = yield getTestInfo(token, test.id);
                        if (testInfo)
                            exam.tests.push(testInfo);
                    }
                }
                res.render('score', { title: `Danh sách điểm của ${name}`, exams: exams });
            }
        }
    }
    catch (e) {
        res.send(e);
    }
}));
app.listen(port, () => console.log(`GetScoreOnLuyen is listening on port ${port}`));
function login(email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data } = yield axios_1.default.post('https://oauth.onluyen.vn/api/account/login', {
                "phoneNumber": email,
                "password": password,
                "rememberMe": false,
                "socialType": "Email",
                "userName": email
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
            });
            return { token: data.access_token, name: data.display_name };
        }
        catch (e) {
            return undefined;
        }
    });
}
function getListExam(token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data } = yield axios_1.default.get('https://api-elb.onluyen.vn/api/school-online/exam/list', {
                headers: {
                    authorization: `Bearer ${token}`,
                    "content-type": "application/json"
                }
            });
            let exams = [];
            for (const exam of data) {
                exams.push({ id: exam.id, title: exam.title });
            }
            return exams;
        }
        catch (e) {
            return [];
        }
    });
}
function getTests(token, examId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data } = yield axios_1.default.get(`https://api-elb.onluyen.vn/api/school-online/exam/detail/${examId}`, {
                headers: {
                    authorization: `Bearer ${token}`,
                    "content-type": "application/json"
                }
            });
            let subjects = [];
            for (const subject of data.data) {
                subjects.push({ id: subject.id });
            }
            return subjects;
        }
        catch (e) {
            return [];
        }
    });
}
function getTestInfo(token, testId) {
    return __awaiter(this, void 0, void 0, function* () {
        let testInfo = undefined;
        try {
            const { data } = yield axios_1.default.get(`https://api-elb.onluyen.vn/api/school-online/exam/test/info/${testId}`, {
                headers: {
                    authorization: `Bearer ${token}`,
                    "content-type": "application/json"
                }
            });
            testInfo = {
                maxScore: data.maxScore,
                title: data.title,
                totalCorrect: data.totalCorrect,
                totalIncorrect: data.totalIncorrect,
                totalScore: data.totalScore
            };
        }
        catch (e) { }
        return testInfo;
    });
}
