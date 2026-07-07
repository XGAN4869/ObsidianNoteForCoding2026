---
name: frontend-canvas-analyzer
description: Analyze frontend project files and generate Obsidian JSON Canvas maps that explain project logic, folders, modules, parent-child component communication, stores, localStorage/sessionStorage, API calls, readable main and branch user flows, per-flow explanations, key/difficult points, and nested function execution chains. Use when the user asks to draw a canvas, UML-like frontend diagram, component interaction map, data-flow map, user-flow map with store/storage state, difficult-point map, flow explanation map, or beginner-friendly project reading map from Vue, React, uni-app, mini-program, or other frontend code.
---

# Frontend Canvas Analyzer

## Purpose

Generate an Obsidian `.canvas` file that helps a beginner understand a frontend project from zero. Organize the canvas by functional responsibility and interaction flow, not by filename lists alone.

Prioritize evidence from source files. Mark uncertain relationships as "needs confirmation" instead of inventing business logic.

When parent-child communication is important, prioritize the ownership chain over API lists: who holds the state, who triggers the method, who receives the data, and how the updated result flows back.

Default to the simplest canvas that still explains the module correctly. Fewer nodes is better when the user's real question is "who is the parent, who is the child, and how do they communicate".

## Workflow

1. Confirm the target file, folder, or module from the user's request.
2. Read only the necessary project files. Start with routes/pages, entry components, imports, stores, API modules, and storage usage.
3. Build a relationship inventory before writing the canvas:
   - folders and feature modules
   - page/container components, business block components, and presentational/shared components
   - parent-child communication
   - for every important interaction, answer in order:
     - who owns the state
     - who triggers the method
     - who receives the data
     - how the result flows back
   - for every parent-child connection, determine whether it mainly passes:
     - a value
     - an action
     - control authority
     - shared state
   - store state, getters/computed values, and actions/mutations
   - localStorage/sessionStorage keys and read/write/clear timing
   - API request methods, parameters, response flow, and calling components
   - user operation flows, separated into main flow and branch flows when the code has multiple paths
   - for every main or branch flow, explain:
     - what triggers the flow
     - what condition chooses this path
     - which function/component/store/API step runs next
     - what state, cache, or UI changes at each step
     - where the branch returns to the main flow or ends
   - key/difficult points, likely confusion points, and risky modification points
   - nested functions and callback/async execution chains
4. Build a layout and edge plan before writing nodes:
   - Decide the main reading direction, usually left-to-right.
   - Place nodes that connect to each other in the same row or neighboring groups.
   - Leave enough space between connected nodes for arrow labels to be readable.
   - List unavoidable cross-region relationships and reduce them before drawing.
   - Prefer duplicate small reference nodes, inline checkpoints, or "see also" text over long diagonal arrows.
5. Choose the clearest visual mode before writing:
   - Use a main business chain when the user wants to understand how the feature runs.
   - Use separate architecture regions only when the user asks for a module inventory or the system has many independent flows.
   - When parent-child communication is the main question, prefer a compact communication template instead of a full architecture map.
   - When the user says they do not understand the logic order, prefer the `Order-First Reading Template` and make execution order the first reading lane.
6. Create or update an Obsidian JSON Canvas with group nodes, text nodes, and labeled arrows.
7. Validate that the `.canvas` JSON parses and every edge points to existing nodes.
8. Do a visual readability pass: long arrows, diagonal arrows, and edge crossings should be rare and intentional.
9. Also provide a short text explanation: recommended reading order, main flow, each branch flow, component communication chain, and unclear points.

## Component Role Model

When reading or drawing component relationships, prefer this three-layer model:

1. `Page / Container Component`
   - Owns main business data, request results, store connections, cache restore, and cross-block coordination.
   - Usually decides what to pass down and how to merge updates back.
   - Should be the main owner of important state unless code evidence shows otherwise.
2. `Business Block Component`
   - Owns temporary UI state, local interaction state, and formatted display of parent-provided data.
   - Often receives values from the container and emits business events upward.
   - Can hold short-lived form state, panel open state, local validation state, tab state, or section-level interaction state.
3. `Presentational Component`
   - Focuses on UI rendering.
   - Keeps only very light local state when needed.
   - Should avoid owning business rules; prefer receiving values and emitting simple events.

Always classify important components into one of these three roles when the code evidence is sufficient. If a component mixes roles, mark that explicitly as a difficult point instead of pretending the boundary is clean.

## Component Communication First Principles

Do not start with "how should the API be written". Start with one question:

> Is this communication mainly passing a value, an action, control authority, or shared state?

Use that answer to choose the communication explanation:

- `Value`
  - Usually `props`, derived props, selectors, or read-only inputs.
  - Explain who owns the source value and who only displays or formats it.
- `Action`
  - Usually `emit`, callback props, event handlers, or command-style methods.
  - Explain who is allowed to perform the business action.
- `Control authority`
  - Usually `v-model`, controlled props, refs/exposed methods, open/close flags, current-step indexes, or imperative handles.
  - Explain who makes the final decision and who only requests a change.
- `Shared state`
  - Usually store/context/provide-inject/event bus/runtime cache.
  - Explain why the state is shared instead of passed level by level.

Prefer communication interpretations that improve:

1. `Encapsulation`
   - Business ownership stays in the correct layer.
2. `Code simplicity`
   - Fewer redundant props, watchers, or duplicate state copies.
3. `Semantic clarity`
   - Names and edges make it obvious whether the child receives a value, requests an action, asks for control, or reads shared state.

## Minimal Communication Template

When the user's real need is to understand parent-child communication, use this simplified template by default. Do not expand into many regions unless the user asks for a broader architecture view.

Target size:

- Prefer `5-10` nodes total.
- Prefer `3-6` edges total.
- Prefer one main group or even no group if the canvas stays readable.

Recommended node set:

1. `Parent Component`
   - clearly labeled as the parent
   - what real state it owns
2. `Child Component`
   - clearly labeled as the child
   - what local state it owns
3. `Parent -> Child`
   - what values or control flags are passed by props
4. `Child -> Parent`
   - what actions are emitted upward
5. `Flow Back`
   - how the parent updates state and sends the new result back down
6. Optional `Core Summary`
   - one sentence that compresses the whole chain

Recommended reading line:

```text
parent owns real state -> props pass values down -> child emits actions up -> parent updates state -> new props flow back
```

If the diagram starts growing past this and the extra nodes do not improve understanding of parent-child communication, remove them.

## Flow Explanation Rules

When a canvas contains user flows, explain the flows as named runtime paths, not as one vague module list. The explanation should make every flow chart readable on its own.

Separate flows into:

- `Main Flow`: the normal happy path or most important business path.
- `Branch Flow`: conditional paths such as validation failure, empty data, permission/status branches, error handling, cancel/close, retry/polling, cache restore, platform differences, or lifecycle recovery.

For each main or branch flow, create either a flow explanation node near that flow lane or a compact `Flow Explanation` region. Each flow explanation must answer:

1. Trigger: what user action, lifecycle hook, watcher, route entry, or callback starts the flow?
2. Branch condition: why does this path run instead of another path? For the main flow, say it is the default/success path.
3. Ordered steps: what runs first, second, third, using real component/function/store/API names.
4. Data changes: which props, refs, reactive state, store fields, storage keys, request params, or response fields change.
5. UI result: what the user sees after this flow step completes.
6. Return or end: whether the branch returns to the main flow, stops, waits for another trigger, or enters a loop/polling/retry path.

Prefer this node shape for each flow:

```md
## Flow: submit success main flow

Type:
- Main Flow

Trigger:
- User clicks submit in `FormPanel.vue`.

Condition:
- Validation passes.

Steps:
1. `handleSubmit` reads `formData`.
2. `validateForm` confirms required fields.
3. `apiSaveOrder(params)` sends the request.
4. `orderStore.setCurrentOrder` writes the response.
5. Parent updates `visible` and refreshes the list.

State / API / Cache changes:
- `loading = true -> false`
- `orderStore.currentOrder = response.data`

UI result:
- Dialog closes and list shows the new order.

Return / End:
- Returns to the list refresh step in the main page flow.
```

For branch flows, name the branch plainly:

```md
## Branch Flow: validation failure

Type:
- Branch Flow

Condition:
- `validateForm` rejects because required fields are empty.

Steps:
1. `handleSubmit` calls `validateForm`.
2. Validation rejects before the API request.
3. Error messages bind back to form fields.

State / API / Cache changes:
- No API request.
- Form error state updates.

UI result:
- User stays on the form and sees validation hints.

Return / End:
- Ends here until the user edits the form and submits again.
```

Do not collapse multiple branches into one sentence like "handles success and failure". If a branch has different conditions, state writes, or UI outcomes, give it its own short explanation. If a branch is tiny, keep the explanation tiny but still name the condition and result.

## Order-First Reading Template

When the user says they cannot understand the logic order, prioritize a readable execution-order lane without dropping the core `frontend-canvas-analyzer` responsibilities.

In this mode, the canvas should still answer:

- which layer owns the state
- which component or module triggers the method
- which module receives the data next
- where the updated result flows back
- which file the user should edit first if they want to change that step

Recommended execution-order lane:

```text
UI trigger -> page/container handler -> store/service/API/runtime -> state/cache write -> UI/state flow back
```

Recommended supporting nodes:

1. `Role Layer`
   - page/container
   - business block
   - store
   - service/runtime
2. `Key Variables / Functions`
   - include short Chinese meaning when helpful for beginners
3. `Execution Order`
   - the actual sequence from trigger to finish
4. `Where To Modify`
   - tell the reader which file/function to inspect first when changing behavior

If the user is confused about "where should I change code", always add a small `Where To Modify` region or node.

## Canvas Regions

Create these large regions as group nodes when the evidence exists:

- `Project Reading Entry`: recommended reading order and the shortest path to understand the module.
- `Folders / Modules`: important folders, their responsibilities, and key files.
- `Pages / Components`: page/container components, business block components, presentational components, and parent-child structure.
- `Component Communication`: props, emit, v-model, slot, provide/inject, context, callbacks, event bus, and ownership/return-flow chain.
- `Store`: Pinia, Vuex, Redux, Zustand, context store, or other state containers.
- `Local Storage`: localStorage, sessionStorage, cookies, IndexedDB, or framework storage APIs.
- `API / Requests`: request files, request methods, callers, parameters, response data, and error handling.
- `User Flow`: user action -> initialization -> state change -> request -> render/update.
- `Flow Explanation`: one explanation node per important flow. Separate the main flow from branch flows, and explain each flow chart from trigger to finish.
- `Key / Difficult Points`: the most important logic, risky state coordination, confusing branches, and places beginners are likely to misunderstand.
- `Nested Functions`: function wrappers, inner functions, callbacks, closures, lifecycle handlers, watchers, promises, and async chains.
- `Questions / Needs Confirmation`: relationships that are plausible but not directly proven by code.

Important:

- These are optional regions, not a mandatory checklist.
- For parent-child communication maps, do **not** create every region by default.
- If a simple parent-child diagram answers the question, prefer one compact group such as `Parent-Child Communication` or even a single ungrouped lane.

## Visual Layout and Color Rules

Prefer a readable left-to-right business chain over many cross-region lines. When a store or cache is part of the flow, place a store/cache node directly in the flow lane instead of drawing a long line to a distant store region.

When parent-child communication is central, prefer a short local lane like:

```text
container owns state -> business block renders/interacts -> presentational child emits -> container updates -> new value flows down
```

For beginner-friendly component communication maps, this compact lane is usually enough. Do not add extra support regions unless they explain a real confusion point.

When execution order is the user's main problem, make the left-to-right lane explicitly chronological. The reader should be able to answer "what runs first, second, third" just by following one row. Branch rows should be readable as separate paths connected to the main step that creates them.

## Spacing and Arrow Label Readability Rules

Leave visible breathing room between canvas boxes. A diagram is not readable if the connected boxes are so close that arrow labels overlap the node edges.

Use these defaults unless the canvas is intentionally tiny:

- Horizontal spacing between directly connected left-to-right nodes: at least `220-280` px from one node edge to the next node edge.
- Vertical spacing between branch lanes or supporting rows: at least `160-220` px from one row edge to the next row edge.
- Padding inside group nodes: at least `80` px around child nodes, and more when edge labels pass through the group.
- For labeled arrows, leave a clear straight segment in the middle of the edge so the label can sit between boxes without touching either box.
- If an arrow label would be too long for the available gap, shorten the edge label and move the detail into the source or target node text.
- If two labels overlap, first increase spacing, then move the supporting node, then shorten labels, and only then remove non-essential edges.

Prefer readable labels over compact coordinates. It is better for a beginner canvas to be wider with clear arrows than compact with hidden labels.

## Anti-Crossing Layout Rules

Optimize for a beginner opening the canvas in Obsidian. A slightly duplicated node is better than a spiderweb of long arrows.

Before writing the final `.canvas`, apply these layout rules:

- Put the primary user flow in one horizontal lane. Connect adjacent nodes only, using `fromSide: "right"` and `toSide: "left"` whenever possible. Keep enough horizontal gap for the edge label to be readable.
- Put secondary lanes directly below the node that triggers them, not far away on the opposite side of the canvas.
- For branch flows, place the branch lane below or near the exact main-flow step that creates the branch, then explain whether it returns, stops, waits, or loops.
- Keep supporting regions near their caller:
  - API details should sit above or below the flow step that calls them.
  - Nested function details should sit below the flow step/function they explain.
  - Key/difficult points should sit next to the nearest risky node.
  - Registry/store/config details should sit beside the flow checkpoint that reads them.
  - Component communication details should sit beside the container or business block they explain.
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

When a parent-child chain is important, prefer this pattern:

```text
state owner -> handler trigger -> child/business block -> emit/callback/store write -> owner update -> new props/state flow down
```

If that chain cannot be read locally from left to right, add a compact communication lane instead of scattering the edges across distant groups.

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

For important component-communication nodes, also answer:

- Which layer is it: page/container, business block, or presentational?
- Does it mainly receive a value, an action, control authority, or shared state?
- How does the updated result flow back?

When the user is confused about execution order, also answer:

- What runs before this node?
- What runs after this node?
- Which main-flow or branch-flow step does this node belong to?
- If I want to change this behavior, which file/function should I inspect first?

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

When the node is a component, prefer this stronger template when relevant:

```md
## ComponentName.vue

Layer:
- Page / Container | Business Block | Presentational

Role:
- ...

Owns state:
- ...

Receives:
- props / shared state / control flags / callbacks

Triggers:
- click, submit, watch, lifecycle, child emit, store action

Sends to:
- child props / parent emit / store write / API call

Flow back:
- parent updates xxx
- new props/state flow back to child
```

For minimal communication maps, an even shorter component node is preferred:

```md
## index.vue

Parent component

Owns:
- selectedVehicle
- vehicleActive

Does:
- handles submit and close
```

```md
## AttendanceLocationSelector.vue

Child component

Owns:
- formData

Does:
- emits submitVehicle / closeVehicle
```

## Edge Rules

Use labeled arrows to show real relationships:

- parent -> child: `props: valueName`
- child -> parent: `emit: eventName`
- parent -> child control: `controls: visible/currentValue/open`
- child -> parent action request: `requests action: save/delete/submit`
- component -> component shared state: `reads shared state`, `writes shared state`
- component -> store: `reads state`, `calls action`, `updates state`
- component -> API: `calls getList(params)`
- API -> component/store: `returns list/detail/status`
- component -> localStorage: `read key`, `write key`, `clear key`
- user flow step -> next step: `then`, `after success`, `on change`, `on submit`
- user flow -> store/cache checkpoint: `write key`, `read key`, `updates state`, `restores from cache`
- function -> nested function: `defines`, `calls`, `passes callback`, `awaits`

Do not draw arrows for relationships that only share similar names unless imports, calls, props, events, routes, or storage keys prove the link.

For parent-child communication, keep the labels semantically explicit. Prefer:

- `props: userInfo`
- `emit: submitVehicle`
- `v-model: visible`
- `callback: onConfirm`
- `reads shared state: useXxxStore`

Avoid vague labels like `data`, `communicates`, or `interaction`.

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
- If a line label overlaps another node or edge, increase spacing first. If the canvas is still crowded, move the nodes, shorten the label, or remove that edge.

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

When store usage replaces parent-to-child prop drilling, explicitly say that the communication type is `shared state`, and explain why that is simpler or more semantically correct than forwarding values through many layers.

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
- Leave spacing so the canvas is readable in Obsidian, especially between connected boxes with labeled arrows.
- Validate JSON parsing.
- Validate every edge references existing nodes.
- Check that arrows are mostly local, mostly left-to-right, not crossing many unrelated groups, and have enough label space between connected boxes.
- If the first visual pass has many crossings, update the canvas before responding: move groups, split lanes, duplicate local reference nodes, or remove secondary arrows and put those relationships in node text.
- Include a separate `Key / Difficult Points` / `重难点` group unless the user explicitly asks for a minimal diagram.
- If the canvas contains multiple business paths, include flow explanation nodes or a `Flow Explanation` region that separately explains the main flow and each branch flow.
- Each flow explanation must name the trigger, branch condition, ordered steps, state/cache/API changes, UI result, and whether the branch returns to the main flow or ends.
- If parent-child communication is important, include at least one explicit communication lane that answers:
  - who owns the state
  - who triggers the method
  - who receives the data
  - how the updated result flows back
- In the `Pages / Components` or `Component Communication` region, classify important components as page/container, business block, or presentational whenever evidence is sufficient.
- Prefer communication explanations that highlight encapsulation, code simplicity, and semantic clarity.
- If the user's focus is specifically parent-child communication, default to the `Minimal Communication Template`:
  - keep the canvas small
  - clearly label `parent component` and `child component`
  - include the three essential relationships:
    - parent passes values/control by props
    - child sends actions upward by emit/callback
    - parent updates state and the new result flows back down
- Do not add store, API, local storage, nested function, or difficult-point regions unless they are necessary to explain the parent-child communication itself.
- If the user's focus is specifically execution order or "I don't know where to change the code", default to the `Order-First Reading Template`:
  - include one explicit chronological lane
  - include short Chinese meaning for key functions/variables when helpful
  - include at least one `Where To Modify` hint
  - still preserve layer ownership: page/component/store/service/runtime

When the user only asks for a prompt or Skill content, provide the reusable prompt or Skill instructions without creating a canvas.

## Beginner Explanation Requirements

After creating the canvas, summarize in Chinese unless the user requests another language:

- what to read first
- the main data flow
- the main flow: trigger, ordered steps, state/API/cache changes, and final UI result
- each branch flow: branch condition, ordered steps, changed state/API/cache, and where it returns or ends
- the main component interaction flow
- for the most important parent-child chain:
  - who owns the state
  - who triggers the method
  - who receives the data
  - how the result flows back
- whether the communication is mainly value, action, control authority, or shared state
- why that communication choice is better for encapsulation, concise code, or clearer semantics
- the most important store/storage/API relationships
- the most complex nested function chain
- the key/difficult points and why they matter
- any "needs confirmation" points

Keep the explanation practical and tied to file paths, component names, function names, and code evidence.

If the canvas is a simplified parent-child communication map, prefer an equally simple explanation:

- who is the parent component
- who is the child component
- what the parent passes down
- what the child sends up
- how the state flows back after the parent updates it

Do not inflate a simple communication map with long architecture commentary.

If the canvas is an order-first map, make the explanation explicitly chronological and separated by flow:

- what to read first
- what runs second
- what runs third
- which state or storage changes at each step
- where to modify the code for each step

Do not only list modules; make the user feel the runtime order.
