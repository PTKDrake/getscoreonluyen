import axios from "axios";
import e from "express";
import express from 'express';
const app = express();
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true }))
let port = process.env.PORT || 3000;

app.set('views', './views'); // Thư mục views nằm cùng cấp với file app.js
app.set('view engine', 'pug');

const router = express.Router();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/', async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    try {
        const account = await login(email, password);
        if(!account) res.send('Tài khoản không hợp lệ!');
        else{
            const name = account.name;
            const token = account.token;
            let exams: Exam[] = await getListExam(token);
            if(exams.length === 0) res.send('Bạn hiện không có kì thi nào.');
            else{
                for(const exam of exams){
                    exam.tests = [];
                    const tests = await getTests(token, exam.id);
                    for(const test of tests){
                        const testInfo = await getTestInfo(token, test.id);
                        if(testInfo) exam.tests.push(testInfo);
                    }
                }
                res.render('score', { title: `Danh sách điểm của ${name}`, exams: exams});
            }
        }
    } catch (e) {
        res.send(e);
    }
});

app.listen(port, () => console.log(`GetScoreOnLuyen is listening on port ${port}`));

async function login(email: string, password: string): Promise<Account|undefined> {
    try {
        const { data } = await axios.post('https://oauth.onluyen.vn/api/account/login', {
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
        return {token: data.access_token, name: data.display_name};
    } catch (e) {
        return undefined;
    }
}

async function getListExam(token: string): Promise<Exam[]> {
    try {
        const { data } = await axios.get('https://api-elb.onluyen.vn/api/school-online/exam/list', {
            headers: {
                authorization: `Bearer ${token}`,
                "content-type": "application/json"
            }
        });
        let exams: Exam[] = [];
        for (const exam of data) {
            exams.push({ id: exam.id, title: exam.title });
        }
        return exams;
    } catch (e) {
        return [];
    }
}

async function getTests(token: string, examId: string): Promise<Test[]> {
    try {
        const { data } = await axios.get(`https://api-elb.onluyen.vn/api/school-online/exam/detail/${examId}`, {
            headers: {
                authorization: `Bearer ${token}`,
                "content-type": "application/json"
            }
        });
        let subjects: Test[] = [];
        for (const subject of data.data) {
            subjects.push({ id: subject.id });
        }
        return subjects;
    } catch (e) {
        return [];
    }
}

async function getTestInfo(token: string, testId: string): Promise<TestInfo | undefined> {
    let testInfo: TestInfo | undefined = undefined;
    try {
        const { data } = await axios.get(`https://api-elb.onluyen.vn/api/school-online/exam/test/info/${testId}`, {
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
        }
    } catch (e) { }
    return testInfo;
}

interface Account{
    token: string,
    name: string
}

interface Exam {
    id: string,
    title: string,
    tests?: TestInfo[]
}

interface Test {
    id: string
}

interface TestInfo {
    maxScore: number,
    title: string,
    totalCorrect: number,
    totalIncorrect: number,
    totalScore: number
}