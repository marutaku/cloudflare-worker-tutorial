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
		<script>
      window.todos = ${data}
      var todoContainer = document.querySelector("#todos")
      window.todos.forEach(todo => {
        var el = document.createElement("div")
        el.textContent = todo.name
        todoContainer.appendChild(el)
      })
    </script>
  </body>
</html>
`;

const setCache = (todo: { todos: Todo[] }, kv: KVNamespace) => kv.put(`data`, JSON.stringify(todo))
const getCache = (kv: KVNamespace) => kv.get(`data`)

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		let data;
		const cache = await getCache(env.TODOS)
		if (!cache) {
			await setCache(defaultData, env.TODOS)
			data = defaultData
		} else {
			data = JSON.parse(cache)
		}
		console.log(data)
		const response = new Response(render(JSON.stringify(data.todos).replace(/</g, '\\u003c')), {
			headers: { 'Content-Type': 'text/html' },
		});
		return response
	},
};
