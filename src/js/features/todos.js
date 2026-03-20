export function createTodosFeature({ state, saveState, elements }) {
    function renderTodos() {
        elements.todoList.innerHTML = '';

        state.todos.forEach((todo) => {
            const item = document.createElement('li');
            item.className = `todo-item${todo.done ? ' done' : ''}`;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-check';
            checkbox.checked = todo.done;
            checkbox.setAttribute('aria-label', `Mark ${todo.text} as done`);
            checkbox.addEventListener('change', () => toggleTodo(todo.id));

            const text = document.createElement('span');
            text.className = 'todo-text';
            text.textContent = todo.text;

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteTodo(todo.id));

            item.append(checkbox, text, deleteButton);
            elements.todoList.append(item);
        });

        const total = state.todos.length;
        const completed = state.todos.filter((todo) => todo.done).length;

        elements.completedCount.textContent = `${completed} / ${total}`;
        elements.taskCount.textContent = `${total} item${total === 1 ? '' : 's'}`;
        elements.emptyState.hidden = total > 0;
    }

    function addTodo(text) {
        state.todos.unshift({
            id: crypto.randomUUID(),
            text,
            done: false
        });
        saveState();
        renderTodos();
    }

    function toggleTodo(id) {
        state.todos = state.todos.map((todo) => (
            todo.id === id ? { ...todo, done: !todo.done } : todo
        ));
        saveState();
        renderTodos();
    }

    function deleteTodo(id) {
        state.todos = state.todos.filter((todo) => todo.id !== id);
        saveState();
        renderTodos();
    }

    function bindEvents() {
        elements.todoForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const text = elements.todoInput.value.trim();

            if (!text) {
                elements.todoInput.focus();
                return;
            }

            addTodo(text);
            elements.todoInput.value = '';
            elements.todoInput.focus();
        });
    }

    return {
        bindEvents,
        render: renderTodos
    };
}
