---
name: frontend-canvas-analyzer
description: Analyze frontend project files and generate Obsidian JSON Canvas maps that explain project logic, folders, modules, parent-child component communication, stores, localStorage/sessionStorage, API calls, readable user flows, key/difficult points, and nested function execution chains. Use when the user asks to draw a canvas, UML-like frontend diagram, component interaction map, data-flow map, user-flow map with store/storage state, difficult-point map, or beginner-friendly project reading map from Vue, React, uni-app, mini-program, or other frontend code.
---

# Frontend Canvas Analyzer

## Purpose

Generate an Obsidian `.canvas` file that helps a beginner understand a frontend project from zero. Organize the canvas by functional responsibility and interaction flow, not by filename lists alone.

Prioritize evidence from source files. Mark uncertain relationships as "needs confirmation" instead of inventing business logic.

## Workflow

1. Confirm the target file, folder, or module from the user's request.
2. Read only the necessary project files. Start with routes/pages, entry components, imports, stores, API modules, and storage usage.
3. Build a relationship inventory before writing the canvas:
   - folders and feature modules
   - page components, business components, and shared components
   - parent-child communication
   - store state, getters/computed values, and actions/mutations
   - localStorage/sessionStorage keys and read/write/clear timing
   - API request methods, parameters, response flow, and calling components
   - user operation flows
   - key/difficult points, likely confusion points, and risky modification points
   - nested functions and callback/async execution chains
4. Build a layout and edge plan before writing nodes:
   - Decide the main reading direction, usually left-to-right.
   - Place nodes that connect to each other in the same row or neighboring groups.
   - List unavoidable cross-region relationships and reduce them before drawing.
   - Prefer duplicate small reference nodes, inline checkpoints, or "see also" text over long diagonal arrows.
5. Choose the clearest visual mode before writing:
   - Use a main business chain when the user wants to understand how the feature runs.
   - Use separate architecture regions only when the user asks for a module inventory or the system has many independent flows.
6. Create or update an Obsidian JSON Canvas with group nodes, text nodes, and labeled arrows.
7. Validate that the `.canvas` JSON parses and every edge points to existing nodes.
8. Do a visual readability pass: long arrows, diagonal arrows, and edge crossings should be rare and intentional.
9. Also provide a short text explanation: recommended reading order, core flow, and unclear points.

## Canvas Regions

Create these large regions as group nodes when the evidence exists:

- `Project Reading Entry`: recommended reading order and the shortest path to understand the module.
- `Folders / Modules`: important folders, their responsibilities, and key files.
- `Pages / Components`: page-level components, business components, shared components, and parent-child structure.
- `Component Communication`: props, emit, v-model, slot, provide/inject, context, callbacks, or event bus.
- `Store`: Pinia, Vuex, Redux, Zustand, context store, or other state containers.
- `Local Storage`: localStorage, sessionStorage, cookies, IndexedDB, or framework storage APIs.
- `API / Requests`: request files, request methods, callers, parameters, response data, and error handling.
- `User Flow`: user action -> initialization -> state change -> request -> render/update.
- `Key / Difficult Points`: the most important logic, risky state coordination, confusing branches, and places beginners are likely to misunderstand.
- `Nested Functions`: function wrappers, inner functions, callbacks, closures, lifecycle handlers, watchers, promises, and async chains.
- `Questions / Needs Confirmation`: relationships that are plausible but not directly proven by code.

## Visual Layout and Color Rules

Prefer a readable left-to-right business chain over many cross-region lines. When a store or cache is part of the flow, place a store/cache node directly in the flow lane instead of drawing a long line to a distant store region.

## Anti-Crossing Layout Rules

Optimize for a beginner opening the canvas in Obsidian. A slightly duplicated node is better than a spiderweb of long arrows.

Before writing the final `.canvas`, apply these layout rules:

- Put the primary user flow in one horizontal lane. Connect adjacent nodes only, using `fromSide: "right"` and `toSide: "left"` whenever possible.
- Put secondary lanes directly below the node that triggers them, not far away on the opposite side of the canvas.
- Keep supporting regions near their caller:
  - API details should sit above or below the flow step that calls them.
  - Nested function details should sit below the flow step/function they explain.
  - Key/difficult points should sit next to the nearest risky node.
  - Registry/store/config details should sit beside the flow checkpoint that reads them.
- Avoid drawing an edge from a distant support region back into the main flow. Use a short "see details below" text note in the main node instead.
- If one concept is relevant to multiple regions, create a small local reference node in each relevant region instead of drawing multiple long edges to one central hub.
- Do not connect every supporting module to every registry/config node. Show the main relationship in node text, and draw only the 1-2 most important arrows.
- For a region-to-region relationship, connect from a gateway/summary node to another gateway/summary node. Do not connect many child nodes across regions.
- Avoid diagonal arrows that pass through unrelated groups. If a diagonal arrow crosses another group, move the target group, add a local reference node, or remove the edge and explain the relationship in text.
- Keep "Key / Difficult Points" from becoming a hub. Each difficult point should connect to the nearest relevant node or have no edge if the evidence is already in the text.
- Keep "Refactor Roadmap" mostly self-contained. Connect phases to each other, not to many distant implementation nodes.

When a generated canvas looks crowded, reduce edges in this order:

1. Remove cross-region "future merge", "risk area", or "see also" arrows and move that relationship into node text.
2. Replace long edges with local reference nodes.
3. Keep only edges needed to follow the main runtime flow.
4. Keep only one edge from each difficult-point node to its nearest relevant node.

Use consistent visual identities:

- User flow/action nodes: color `"2"`.
- Pages and components: color `"5"`.
- API/request nodes: color `"3"`.
- Store/state-container nodes: color `"6"`.
- Local storage, session storage, runtime cache, cookies, or IndexedDB nodes: color `"6"` or a clearly distinct hex color, but never the same color as user-flow action nodes.
- Key/difficult-point nodes: color `"1"` or a clearly distinct warning color.
- Questions/risks: color `"1"`.

Important: a store node placed inside or next to `User Flow` is still a store node. Keep its store color, title, and content structure. Do not recolor it as a user-flow node just because it appears in the main flow.

If separate `Store` or `Local Storage` regions would create tangled lines, keep those regions as compact reference/detail areas and label them as secondary, such as `Supplemental State Details`. Put the beginner-facing state checkpoints in the main business chain.

## User Flow + Store/Storage Integration Rules

When a user flow reads or writes store/local storage, draw that state step inline in the main chain:

```text
user action -> component handler -> API request -> store/cache write -> polling/render/update -> runtime/store/cache write
```

For inline state nodes, include:

- Key/store name.
- Read/write/clear timing.
- Minimal shape or important fields.
- Who reads it next.

Good flow pattern:

```text
SubmitVehicle component
  -> handleSubmitVehicle
  -> apiModifyCarStatus
  -> attendanceVehicleState
  -> waitVehicleApproved
  -> LOCATION_REPORTER_RUNTIME_STATE
  -> startLocationReporter
```

Avoid this pattern when explaining a single business flow:

```text
User Flow node -> long diagonal line -> distant Store region -> long diagonal line -> User Flow node
```

Long cross-region lines are only acceptable for overview architecture maps. For beginner reading maps, prefer inline state checkpoints and short arrows.

## Key / Difficult Points Rules

Always create a separate `Key / Difficult Points` or `重难点` group when generating an actual canvas. Keep it separate from `Questions / Needs Confirmation`:

- `Key / Difficult Points`: proven difficult logic from the code.
- `Questions / Needs Confirmation`: plausible but unproven relationships or assumptions.

Include 3-7 nodes unless the module is tiny. Prioritize:

- State coordination across page state, store, local storage, runtime cache, or API responses.
- Async flows, polling, retry, cancellation, debounce/throttle, race conditions, and lifecycle recovery.
- Parent-child component boundaries where emit/props/store responsibilities are easy to confuse.
- Business branches with different paths for user types, permissions, statuses, or platforms.
- Duplicate-looking logic that exists in multiple files for real lifecycle reasons.
- Places that are risky to refactor because behavior is hard to verify.

Use this node shape:

```md
## Difficult Point: cache recovery

Why it is hard:
- Page reload, App foreground, and login all restore from different entry points.

Evidence:
- `onLoad -> restoreVehicleState`
- `App.vue onShow -> shouldResumeLocationReporter`
- `accountStore.resumeVehicleLocation`

How to read it:
- First follow the normal submit flow.
- Then read each recovery entry separately.

Risk when changing:
- Updating the cache shape requires checking every reader and writer.
```

Connect difficult-point nodes only to the nearest relevant flow/store/component node. Avoid using the difficult-points group as a spiderweb hub.

## Node Content Rules

Each important node should answer three beginner-friendly questions:

- What does this file/component/function do?
- What does it depend on?
- What does it affect?

Prefer this text-node structure:

```md
## ComponentName.vue

Role:
- Page component for ...

Depends on:
- ChildA via import
- useXxxStore()
- getXxxList()

Affects:
- Passes xxx to ChildA through props
- Updates store.xxx after submit
- Writes localStorage key `xxx`
```

Use file nodes only when linking directly to useful source files improves navigation. Use text nodes for explanations.

## Edge Rules

Use labeled arrows to show real relationships:

- parent -> child: `props: valueName`
- child -> parent: `emit: eventName`
- component -> store: `reads state`, `calls action`, `updates state`
- component -> API: `calls getList(params)`
- API -> component/store: `returns list/detail/status`
- component -> localStorage: `read key`, `write key`, `clear key`
- user flow step -> next step: `then`, `after success`, `on change`, `on submit`
- user flow -> store/cache checkpoint: `write key`, `read key`, `updates state`, `restores from cache`
- function -> nested function: `defines`, `calls`, `passes callback`, `awaits`

Do not draw arrows for relationships that only share similar names unless imports, calls, props, events, routes, or storage keys prove the link.

For the main business chain, prefer arrows that connect adjacent left/right node sides. Avoid top/bottom or backtracking arrows inside the main chain unless the code truly loops or branches. Put branch and recovery details in separate short rows or in node text.

Use a strict edge budget for beginner reading maps:

- Main flow: draw adjacent step-to-step arrows.
- Parent-child communication: draw only the essential props/emit arrows.
- Store/cache/API checkpoints: draw inline arrows in the flow lane.
- Support regions: draw few or no outgoing edges. Let node text carry secondary relationships.
- Cross-region edges: allow only when the relationship is essential and cannot be understood from local text.
- If more than two arrows would cross between the same two regions, replace them with one gateway node and one labeled edge.

Before finishing, scan the canvas visually:

- No group should be crossed by multiple unrelated long arrows.
- No row should have arrows traveling both left-to-right and right-to-left unless it represents a real loop.
- No single hub node should send arrows across three or more distant regions in a beginner map.
- If a line label overlaps another node or edge, move the nodes or remove that edge.

## Nested Function Rules

When code contains functions inside functions, callbacks, closures, watchers, computed logic, lifecycle hooks, event handlers, or async chains, draw them as layered nodes in the `Nested Functions` region.

For each layer, include code plus explanation. Keep code snippets short and focused: function name, parameters, return value, call site, and core logic.

Example node format:

````md
## handleSubmit

Code:
```js
const handleSubmit = async () => {
  await validateForm()
  await submitData()
  refreshList()
}
```

Explanation:
- Trigger: user clicks submit.
- Parameters: none, reads form state from the component.
- Work: validates form, submits data, then refreshes list.
- Calls: validateForm -> submitData -> refreshList.
- Affects: form validation state, API request, list render.
````

Draw nested function layers like this:

```text
outer function
  -> inner function
    -> callback function
      -> real business operation
```

For Vue code, inspect these places carefully:

- `setup` functions and returned bindings
- `<script setup>` top-level functions
- `methods` methods that call each other
- `watch` and `watchEffect`
- `computed`
- `onMounted`, `onLoad`, `onShow`, `created`, `mounted`
- click/change/submit/confirm handlers
- `then`, `catch`, `finally`, and `async/await` continuation logic

For React code, inspect these places carefully:

- component body functions
- hooks such as `useEffect`, `useMemo`, `useCallback`, and custom hooks
- event handlers
- context/provider wrappers
- Redux/Zustand actions
- promise callbacks and async handlers

## Store Analysis Rules

For each store, separate:

- State: what data it owns.
- Derived values: getters, computed selectors, memoized selectors.
- Actions/mutations: who calls them and what they change.
- Consumers: which pages/components read or write the store.
- Side effects: API calls, storage writes, route changes, or cross-store updates.

Represent store nodes as a hub when making an architecture view. In beginner user-flow views, also create small inline store checkpoint nodes at the exact point where the flow reads, writes, or clears store state. These inline nodes must keep store color and store wording.

## Storage Analysis Rules

For each local cache usage, identify:

- key name
- stored data shape
- write timing
- read timing
- clear/expire timing
- affected page/component/store

If the key is dynamically generated, show the expression and explain what part is dynamic.

When storage is central to a user flow, place the storage key node in the flow instead of isolating it in a distant `Local Storage` region. Keep a separate storage/detail region only for extra fields, edge cases, or all-key inventories.

## API Analysis Rules

For each request flow, identify:

- API function name and source file
- request method/path when visible
- caller component/store/function
- parameter source
- response destination
- success branch
- failure branch
- loading/empty/error UI state when visible

When a request participates in a user flow, connect it to the `User Flow` region as well as the `API / Requests` region.

For readability, prefer one of these patterns:

- Inline API node in the main flow when the request is central.
- Nearby API detail node below the flow step when the request has important parameters or response handling.
- API inventory region with text-only references when the requests are not part of the main flow.

Do not draw long arrows from every API inventory node to every caller if that creates crossing lines. Put caller names inside the API node text instead.

## Output Requirements

When the user asks for an actual canvas file:

- Create a valid `.canvas` JSON file.
- Use unique node and edge IDs.
- Use group nodes for the large regions.
- Place child nodes inside their group bounds.
- Leave spacing so the canvas is readable in Obsidian.
- Validate JSON parsing.
- Validate every edge references existing nodes.
- Check that arrows are mostly local, mostly left-to-right, and not crossing many unrelated groups.
- If the first visual pass has many crossings, update the canvas before responding: move groups, split lanes, duplicate local reference nodes, or remove secondary arrows and put those relationships in node text.
- Include a separate `Key / Difficult Points` / `重难点` group unless the user explicitly asks for a minimal diagram.

When the user only asks for a prompt or Skill content, provide the reusable prompt or Skill instructions without creating a canvas.

## Beginner Explanation Requirements

After creating the canvas, summarize in Chinese unless the user requests another language:

- what to read first
- the main data flow
- the main component interaction flow
- the most important store/storage/API relationships
- the most complex nested function chain
- the key/difficult points and why they matter
- any "needs confirmation" points

Keep the explanation practical and tied to file paths, component names, function names, and code evidence.
