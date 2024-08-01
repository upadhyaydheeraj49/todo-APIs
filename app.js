const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const {isValid} = require('date-fns')

const app = express()
app.use(express.json())

let db = null
const initializeDbAndServer = async () => {
  const dbPath = path.join(__dirname, 'todoApplication.db')
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started')
    })
  } catch (e) {
    console.log('Error : ' + e.message)
    process.exit(1)
  }
}
initializeDbAndServer()

const checkDataMiddleware = (request, response, next) => {
  const {status = '', priority = '', category = '', date = ''} = request.query

  //status check
  if (
    status !== 'TO DO' &&
    status !== 'IN PROGRESS' &&
    status != 'DONE' &&
    status !== ''
  ) {
    response.status(400)
    response.send('Invalid Todo Status')
  }

  //priority check
  else if (
    priority !== 'HIGH' &&
    priority !== 'MEDIUM' &&
    priority !== 'LOW' &&
    priority !== ''
  ) {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
  //category check
  else if (
    category !== 'WORK' &&
    category !== 'HOME' &&
    category != 'LEARNING' &&
    category !== ''
  ) {
    response.status(400)
    response.send('Invalid Todo Category')
  }
  //check dueDate
  else if (date !== '') {
    const queryDate = new Date(date)
    if (isValid(queryDate)) {
      next()
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  } else {
    next()
  }
}

const checkDataMiddlewareForPOST = (request, response, next) => {
  const {
    todo = '',
    status = '',
    priority = '',
    category = '',
    dueDate = '',
  } = request.body

  if (todo !== '') {
    request.message = 'Todo'
  } else if (status !== '') {
    request.message = 'Status'
  } else if (priority !== '') {
    request.message = 'Priority'
  } else if (category !== '') {
    request.message = 'Category'
  }

  //check status
  if (
    status !== 'TO DO' &&
    status !== 'IN PROGRESS' &&
    status != 'DONE' &&
    status !== ''
  ) {
    request.message = 'Status'
    response.status(400)
    response.send('Invalid Todo Status')
  }

  //priority check
  else if (
    priority !== 'HIGH' &&
    priority !== 'MEDIUM' &&
    priority !== 'LOW' &&
    priority !== ''
  ) {
    request.message = 'Priority'
    response.status(400)
    response.send('Invalid Todo Priority')
  }
  //category check
  else if (
    category !== 'WORK' &&
    category !== 'HOME' &&
    category != 'LEARNING' &&
    category !== ''
  ) {
    request.message = 'Category'
    response.status(400)
    response.send('Invalid Todo Category')
  }
  //check dueDate
  else if (dueDate !== '') {
    const queryDate = new Date(dueDate)
    if (isValid(queryDate)) {
      //console.log("Hello");
      request.message = 'Due Date'
      next()
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  } else {
    next()
  }
}

app.get('/todos/', checkDataMiddleware, async (request, response) => {
  const {
    status = '',
    priority = '',
    search_q = '',
    category = '',
  } = request.query

  //console.log(status);
  const getTodosQuery = `
      SELECT 
          id,
          todo,
          priority,
          status,
          category,
          due_date AS dueDate
      FROM 
          todo
      WHERE status LIKE '%${status}%'
          AND priority LIKE '%${priority}%'
          AND todo LIKE '%${search_q}%'
          AND category LIKE '%${category}%'
      ;
    `

  const todosList = await db.all(getTodosQuery)
  response.send(todosList)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
      SELECT
          id,
          todo,
          priority,
          status,
          category,
          due_date AS dueDate
      FROM 
          todo
      WHERE id = ${todoId}
      ;
    `
  const todo = await db.get(getTodoQuery)
  response.send(todo)
})

app.get('/agenda/', checkDataMiddleware, async (request, response) => {
  const {date = ''} = request.query

  const getAgendaQuery = `
        SELECT 
          id,
          todo,
          priority,
          status,
          category,
          due_date AS dueDate
        FROM 
            todo
        WHERE
            due_date = '${date}'
          ;
      `

  const todoAgendaList = await db.all(getAgendaQuery)
  response.send(todoAgendaList)
})

app.post('/todos/', checkDataMiddlewareForPOST, async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status, category, dueDate} = todoDetails

  const addTodoQuery = `
      INSERT INTO
          todo(id, todo, priority, status, category, due_date)
      VALUES
          (
            ${id},
            '${todo}',
            '${priority}',
            '${status}',
            '${category}',
            '${dueDate}'
          );
      `

  await db.run(addTodoQuery)
  response.send('Todo Successfully Added')
})

app.put(
  '/todos/:todoId/',
  checkDataMiddlewareForPOST,
  async (request, response) => {
    const {todoId} = request.params
    const getTodoQuery = `
      SELECT
          *
      FROM 
          todo
      WHERE id = ${todoId}
      ;
    `
    const todoObj = await db.get(getTodoQuery)
    const {
      todo = todoObj.todo,
      priority = todoObj.priority,
      status = todoObj.status,
      category = todoObj.category,
      dueDate = todoObj.due_date,
    } = request.body

    const updateTodoQuery = `
      UPDATE todo
      SET
        todo='${todo}',
        priority='${priority}',
        status='${status}',
        category='${category}',
        due_date='${dueDate}'
      WHERE id = ${todoId}
      ; 
      `
    const updatedValue = request.message
    await db.run(updateTodoQuery)
    response.send(`${updatedValue} Updated`)
  },
)

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoQuery = `
      DELETE 
      FROM todo
      WHERE id = ${todoId}
      ;
    `
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
