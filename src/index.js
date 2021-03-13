const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers
  const user = users.find(user => username === user.username)
  if(!user) return response.status(404).send({error: 'Usuario nao encontrado'})
  request.user = user
  next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body
  if (!name || !username) return response.status(400).send()
  const hasUser = users.some(user => username === user.username)
  if (hasUser) return response.status(400).json({error: 'Usuario ja existe'})
  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }
  users.push(user)
  return response.status(201).json(user)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request
  return response.status(200).json(user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body
  const { user }  = request
  if (!title || !deadline) return response.status(400).send()
  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: (new Date(deadline)).toISOString(),
    created_at: (new Date()).toISOString()
  }
  user.todos.push(todo)
  return response.status(201).json(todo)
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body
  const { id } = request.params
  const { user }  = request
  if (!title || !deadline) return response.status(400).send()

  const todo = user.todos.find(todo => todo.id == id)
  if (!todo) response.status(404).json({error: 'Todo nao existe'})

  todo.title = title
  todo.deadline = (new Date(deadline)).toISOString()

  return response.status(202).json({
    deadline: todo.deadline,
    done: todo.done,
    title: todo.title
  })
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const user = request.user
  
  const todo = user.todos.find(todo => todo.id == id)
  if (!todo) response.status(404).json({error: 'Todo nao existe'})

  todo.done = true

  return response.status(202).json(todo)
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const user = request.user
  
  const hasTodo = user.todos.some(todo => todo.id == id)
  if (!hasTodo) response.status(404).json({error: 'Todo nao existe'})

  user.todos = user.todos.filter(todo => todo.id !== id)
  return response.status(204).send()
});

module.exports = app;