/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	TODOS: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

type Todo = {
	id: number;
	name: string;
	completed: boolean;
}

const defaultData = {
	todos: [
		{
			id: 1,
			name: "Finish the Cloudflare Workers blog post",
			completed: false
		}
	]
}

const render = (data: string) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Todos</title>
  </head>
  <body>
    <h1>Todos</h1>
		<div id="todos"></div>
		<div>
			<input type="text" name="name" placeholder="A new todo"></input>
			<button id="create">Create</button>
	  </div>
		<script>
      window.todos = ${data}
      var todoContainer = document.querySelector("#todos")
      window.todos.forEach(todo => {
        var el = document.createElement("div")
        el.textContent = todo.name
        todoContainer.appendChild(el)
      })
			var createTodo = function() {
				var input = document.querySelector("input[name=name]")
				if (input.value.length !== 0) {
					todos = [].concat(window.todos, {
						id: todos.length + 1,
						name: input.value,
						completed: false,
					})
					fetch("/", {
						method: "PUT",
						body: JSON.stringify({ todos: todos }),
					})
					window.todos = todos
				}

			}

			document.querySelector("#create").addEventListener("click", createTodo)
		</script>
		</body>
	</html>
	`;


const setCache = (todo: { todos: Todo[] }, kv: KVNamespace) => kv.put(`data`, JSON.stringify(todo))
const getCache = (kv: KVNamespace) => kv.get(`data`)


async function updateTodos(request: Request, env: Env) {
	const body = await request.text();
	try {
		await setCache(JSON.parse(body), env.TODOS);
		return new Response(body, { status: 200 });
	} catch (err) {
		return new Response(String(err), { status: 500 });
	}
}

const getTodos = async (env: Env) => {
	let data;
	const cache = await getCache(env.TODOS)
	if (!cache) {
		await setCache(defaultData, env.TODOS)
		data = defaultData
	} else {
		data = JSON.parse(cache)
	}

	const response = new Response(render(JSON.stringify(data.todos).replace(/</g, '\\u003c')), {
		headers: { 'Content-Type': 'text/html' },
	});
	return response
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === 'PUT') {
			return updateTodos(request, env);
		} else {
			return getTodos(env)
		}
	},
};
