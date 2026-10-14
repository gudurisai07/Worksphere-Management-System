# Employee Management: Spring Boot + MySQL + React

```
employees-fullstack/
├── Employee/                  <- your Spring Boot backend (port 7777), corrected
└── employee-frontend/         <- React + Vite frontend (port 5173), new
```

Two separate applications. React (browser, port 5173) calls Spring Boot (port 7777), which talks to MySQL (port 3306, database `company`).

## 1. What I found in your backend

| # | Finding | Fix |
|---|---------|-----|
| 1 | `application.properties`: `spring.datasourcce.Driver-class-name` is misspelled (3 c's, capital D). Spring silently ignored it. | Now `spring.datasource.driver-class-name`. **Your URL, username and password are unchanged.** |
| 2 | No Swagger. | Added `springdoc-openapi-starter-webmvc-ui` **3.1.0** to `pom.xml`. Version 3.x is the line built for Spring Boot 4.x (3.1.0 is built on Boot 4.1.0; you use 4.1.1). The 2.x line is for Boot 3 and would not work. Spring Boot and Java versions are untouched. |
| 3 | `GET /manager/getmgr/{eid}` and `/geteml/{gmail}` returned **200 with an empty body** when nothing matched. | Now **404** with a JSON message. |
| 4 | `PUT` / `DELETE` of a missing id threw a bare `RuntimeException` -> **500**. | Now **404** with a JSON message. |
| 5 | `POST` with an `eid` in the body would **overwrite** that existing employee (JPA `save` = insert-or-update). | `eid` is forced to `null` on create. |
| 6 | Duplicate emails would make `findByGmail` crash with a 500 as soon as two rows matched. | Create/update reject a duplicate email with **409**. Lookup uses `findFirst...` so old duplicate rows can't crash it. |
| 7 | No CORS, so the browser blocks React calling port 7777. | New `config/CorsConfig.java` allows `http://localhost:5173` and `http://127.0.0.1:5173`. |
| 8 | Bad input (name/email missing, bad JSON, `/getmgr/abc`) gave unhelpful errors. | Clean 400 JSON errors. |

**Not problems:** `spring-boot-starter-webmvc` is the correct "Spring Web" starter for Spring Boot 4 (the old name `spring-boot-starter-web` is Boot 3). The Lombok setup, `*-test` starters and devtools are fine. The empty `<license/>`, `<developer/>` tags in `pom.xml` are harmless Initializr leftovers.

**Intentional behaviour changes (everything else is preserved):** all 7 paths are unchanged; `POST` now answers **201 Created** instead of 200; the not-found/duplicate/bad-input responses above.

### Backend files changed or added (inside `Employee/src/main/java/com/project/Employee/`)
- `pom.xml` (springdoc dependency added)
- `src/main/resources/application.properties` (typo fixed)
- `Controller/Employeecontroller.java` (`@ResponseStatus(CREATED)` on POST; otherwise identical)
- `service/Employeeservices.java` (not-found, duplicate, validation, eid-reset)
- `repo/Employeerepo.java` (Optional + email checks)
- NEW `exception/` (`EmployeeNotFoundException`, `DuplicateEmailException`, `InvalidEmployeeException`, `GlobalExceptionHandler`)
- NEW `config/CorsConfig.java`
- Unchanged: `EmployeeApplication`, `model/Manager`, `service/Employeeservice`, test class

### What each backend class does
| Class | Purpose |
|---|---|
| `EmployeeApplication` | `main()` method that starts Spring Boot. |
| `model/Manager` | JPA entity mapped to table `employees`: `eid` (auto-increment), `ename`, `age`, `salary`, `gmail`, `phoneno`. Lombok generates getters/setters. |
| `repo/Employeerepo` | Spring Data JPA interface. Gives save/findAll/findById/delete for free; custom email queries. |
| `service/Employeeservice` | Interface listing the operations. |
| `service/Employeeservices` | Implementation: business rules and calls to the repository. |
| `Controller/Employeecontroller` | REST endpoints under `/manager`. |
| `exception/*` | Turn errors into proper HTTP status codes and JSON. |
| `config/CorsConfig` | Lets the React app (another origin) call the API. |

## 2. Prerequisites
- **JDK 25** (your `pom.xml` says `java.version` 25). Check: `java -version`
- **MySQL** running on `localhost:3306`, with a database called `company` and user `root` / password `12345` (as in your properties). Create the database once if needed: `CREATE DATABASE company;`
- **Node.js 20.19+ or 22.12+** (needed by Vite 7). Check: `node -v`
- Maven is NOT required: the project has the Maven Wrapper (`mvnw`).

## 3. Run the backend (VS Code terminal 1)
```bash
cd Employee
./mvnw spring-boot:run          # Windows PowerShell / cmd:  .\mvnw.cmd spring-boot:run
```
Wait for `Started EmployeeApplication` and `Tomcat started on port 7777`. Check: open http://localhost:7777/manager/wel -> `hi sai`.
(If you installed Maven yourself, `mvn spring-boot:run` also works. In VS Code you can also use the Spring Boot Dashboard / "Run" above `main`.)

Note: `./mvnw test` / `package` runs `EmployeeApplicationTests`, which needs MySQL running. Use `-DskipTests` to skip.

## 4. Swagger UI
- UI: **http://localhost:7777/swagger-ui/index.html**  (`/swagger-ui.html` redirects to it)
- Raw OpenAPI JSON: http://localhost:7777/v3/api-docs

In Swagger: click an endpoint -> **Try it out** -> fill parameters/body -> **Execute**.

## 5. Run the frontend (VS Code terminal 2)
```bash
cd employee-frontend
npm install
npm run dev
```
Open **http://localhost:5173**. It must be 5173 (the CORS rule allows that origin; `strictPort` makes Vite fail instead of silently picking 5174). The backend URL is in `employee-frontend/.env` (`VITE_API_BASE_URL=http://localhost:7777`); restart `npm run dev` after editing it.

`npm install` creates `package-lock.json`. Commit it. The axios range is `^1.15.1` on purpose: axios 1.14.1 (and 0.30.4) were malicious releases published on 31 March 2026. Run `npm ls axios` and confirm it is not 1.14.1.

### Frontend structure
```
employee-frontend/
├── index.html
├── package.json
├── vite.config.js
├── .env / .env.example
└── src/
    ├── main.jsx                   entry point
    ├── App.jsx                    state + all CRUD/search logic
    ├── index.css                  styles (responsive)
    ├── api/axiosConfig.js         ONE axios instance, reusable base URL
    ├── api/employeeApi.js         one function per backend endpoint
    ├── utils/validation.js        form + search validation, payload builder
    ├── utils/errors.js            Axios error -> readable message
    └── components/
        ├── EmployeeForm.jsx       add / edit form (no eid in create mode)
        ├── EmployeeTable.jsx      table (cards on phones)
        ├── SearchBar.jsx          search by ID or email
        ├── ConfirmDialog.jsx      delete confirmation
        ├── Alert.jsx              success / error banner
        └── Spinner.jsx            loading indicator
```

## 6. API contract (what the frontend uses)
Employee JSON: `{ "eid": 1, "ename": "Asha Rao", "age": 28, "salary": 45000.0, "gmail": "asha@example.com", "phoneno": 9876500001 }`

| Action | Request | Success | Failure |
|---|---|---|---|
| Welcome | `GET /manager/wel` | 200 `hi sai` | - |
| List | `GET /manager/getmanager` | 200 `[ {...}, ... ]` (`[]` if empty) | - |
| By ID | `GET /manager/getmgr/1` | 200 `{...}` | 404 `Employee not found with id: 99`; 400 if id is not a number |
| By email | `GET /manager/geteml/asha@example.com` | 200 `{...}` | 404 `Employee not found with email: ...` |
| Create | `POST /manager` body below | **201** `{ "eid": 3, ... }` | 400 missing/invalid; 409 duplicate email |
| Update | `PUT /manager/update/3` body below | 200 `{...}` | 404; 400; 409 |
| Delete | `DELETE /manager/delete/3` | 200 text `Manager 3 deleted successfully` | 404 |

Create / update body (do **not** send `eid`):
```json
{
  "ename": "Meena Devi",
  "age": 31,
  "salary": 60000.75,
  "gmail": "meena@example.com",
  "phoneno": 9123456780
}
```
Error body shape:
```json
{ "timestamp": "2026-10-13T10:15:30", "status": 404, "error": "Not Found",
  "message": "Employee not found with id: 99", "path": "/manager/getmgr/99" }
```

## 7. Verify Create / Read / Update / Delete / Search against real MySQL
Keep a MySQL shell open: `mysql -u root -p company` then `SELECT * FROM employees;` after each step.

1. **Create** - In React fill the form -> *Add Employee*. Expect a green message "added with ID n", the new table row, and a new row in `SELECT * FROM employees;`. The Spring console prints the `insert into employees ...` SQL.
2. **Read** - Reload the page; the rows come from MySQL. Also http://localhost:7777/manager/getmanager shows the same JSON.
3. **Update** - *Edit* on a row, change salary, *Update Employee*. Expect "updated successfully" and the changed value in `SELECT`.
4. **Search** - By ID (existing and non-existing), by email (existing and non-existing). Non-existing shows "No employee found with ...". Click *Show all* to return.
5. **Delete** - *Delete* -> dialog -> *Delete*. Expect the row gone and gone from `SELECT`.
6. **Duplicate email** - add the same email twice; the second shows "already exists" (409).
7. In the browser DevTools -> Network tab you can see each call to `localhost:7777/manager/...`.

## 8. Troubleshooting
**CORS** - Console says `blocked by CORS policy` / Network shows `(failed)` on an OPTIONS request.
- The React app must be opened at `http://localhost:5173` or `http://127.0.0.1:5173` (anything else, e.g. 5174 or 3000, is not allowed). To allow another origin, add it in `config/CorsConfig.java` and restart Spring Boot.
- Confirm `CorsConfig.java` exists and the backend was restarted after adding it.
- Note: the browser shows the *same* "Network Error" for CORS and for a stopped backend. Check the next item first.

**Connection refused / "Cannot reach the backend"**
- Is Spring Boot running? Open http://localhost:7777/manager/wel.
- Spring failed to start? Read the console. Common causes: MySQL not running, database `company` missing, wrong password ("Access denied"), port 7777 already in use.
- `.env` URL wrong? It must be `http://localhost:7777` with no trailing path.

**404**
- Wrong path or typo: the real paths are `/manager/getmanager`, `/manager/getmgr/{eid}`, `/manager/geteml/{gmail}`, `POST /manager`, `/manager/update/{eid}`, `/manager/delete/{eid}`.
- A 404 with a JSON `message` like "Employee not found with id: 9" is correct behaviour (that id doesn't exist).

**500**
- Look at the Spring Boot console stack trace first. Usual causes: MySQL stopped, `Unknown database 'company'`, `Access denied for user 'root'`, or data that doesn't fit a column.
- `Database error...` in the UI means a `DataAccessException`: check MySQL.

**Frontend won't start** - `Port 5173 is already in use`: close the other Vite process (strictPort is intentional). `node -v` below 20.19: upgrade Node.

## 9. What was and was not tested (honest status)
Tested in a sandbox WITHOUT Maven, MySQL, JDK 25 or npm registry access:
- The new Java code compiled with `javac` (Java 21) against **stub** copies of the Spring/Lombok APIs I use. This catches syntax/type errors only.
- The React app bundled with esbuild (all JSX and imports resolve) and was driven in headless Chromium: 24 checks across create / read / update / delete / search by ID and email / validation / confirm dialog / empty list / not-found / 409 / 500 / connection failure / mobile layout / real browser CORS. 17 more unit tests on the validation functions. These ran against a **mock server** that I wrote to follow the corrected backend's contract, and with a small fetch-based stand-in for axios.

NOT tested: the real Spring Boot startup, springdoc/Swagger UI, real MySQL, `npm install` with real Vite/axios. Please run section 3-7 and tell me the exact error text of anything that fails.
