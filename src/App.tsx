import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { Authenticator, useAuthenticator, ThemeProvider, Theme } from '@aws-amplify/ui-react';
import { generateClient } from "aws-amplify/data";
import '@aws-amplify/ui-react/styles.css';
import { signInWithRedirect } from 'aws-amplify/auth';

const client = generateClient<Schema>();

function TodoList() {
  const { user, signOut } = useAuthenticator();
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id })
  }

  return (
    <main>
      <h1>My todos</h1>
      <button onClick={createTodo}>+ new</button>
      <h1>{user?.signInDetails?.loginId}'s todos</h1>
      <ul>
        {todos.map((todo) => (
          <li onClick={() => deleteTodo(todo.id)} key={todo.id}>{todo.content}</li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
          Review next step of this tutorial.
        </a>
      </div>
      <button onClick={signOut}>Sign out</button>
      <button onClick={() => signInWithRedirect({ provider: 'Google' })}>
        Sign in with Google
      </button>
    </main>
  );
}

function App() {
  return (
    <ThemeProvider theme={Theme.Light}>
      <Authenticator.Provider>
        <Authenticator>
          <TodoList />
        </Authenticator>
      </Authenticator.Provider>
    </ThemeProvider>
  );
}

export default App;
