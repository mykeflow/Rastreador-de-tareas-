import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TASKS_FILE = path.resolve(__dirname, '../tasks.json');

type TaskStatus = 'todo' | 'in-progress' | 'done';

interface Task {
  id: number;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

async function loadTasks(): Promise<Task[]> {
  try {
    const data = await fs.readFile(TASKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function saveTasks(tasks: Task[]): Promise<void> {
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 4), 'utf-8');
}

function getNextId(tasks: Task[]): number {
  return tasks.length === 0 ? 1 : Math.max(...tasks.map(t => t.id)) + 1;
}

async function addTask(description: string): Promise<void> {
  const tasks = await loadTasks();
  const id = getNextId(tasks);
  const now = new Date().toISOString();
  const task: Task = {
    id,
    description,
    status: 'todo',
    createdAt: now,
    updatedAt: now
  };
  tasks.push(task);
  await saveTasks(tasks);
  console.log(`Task added successfully (ID: ${id})`);
}

async function updateTask(id: number, newDescription: string): Promise<void> {
  const tasks = await loadTasks();
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    console.error(`Error: Task with ID ${id} not found.`);
    return;
  }
  tasks[taskIndex].description = newDescription;
  tasks[taskIndex].updatedAt = new Date().toISOString();
  await saveTasks(tasks);
  console.log(`Task ${id} updated successfully.`);
}

async function deleteTask(id: number): Promise<void> {
  const tasks = await loadTasks();
  const newTasks = tasks.filter(t => t.id !== id);
  await saveTasks(newTasks);
  console.log(`Task ${id} deleted successfully.`);
}

async function markStatus(id: number, status: TaskStatus): Promise<void> {
  const tasks = await loadTasks();
  const task = tasks.find(t => t.id === id);
  if (!task) {
    console.error(`Error: Task with ID ${id} not found.`);
    return;
  }
  task.status = status;
  task.updatedAt = new Date().toISOString();
  await saveTasks(tasks);
  console.log(`Task ${id} marked as ${status}.`);
}

async function listTasks(filter: TaskStatus | null = null): Promise<void> {
  let tasks = await loadTasks();
  if (filter) {
    tasks = tasks.filter(t => t.status === filter);
  }

  if (tasks.length === 0) {
    console.log("No tasks found.");
    return;
  }

  tasks.forEach(task => {
    console.log(`[${task.id}] ${task.description} (${task.status})`);
    console.log(`  Created: ${task.createdAt}`);
    console.log(`  Updated: ${task.updatedAt}\n`);
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: npm run start -- <command> [args]");
    return;
  }

  const command = args[0];

  switch (command) {
    case "add":
      if (args.length < 2) {
        console.error("Error: Missing task description.");
        return;
      }
      await addTask(args.slice(1).join(" "));
      break;

    case "update":
      if (args.length < 3) {
        console.error("Error: Usage is 'update <id> <new description>'.");
        return;
      }
      const idUpdate = parseInt(args[1]);
      if (isNaN(idUpdate)) {
        console.error("Error: Task ID must be an integer.");
        return;
      }
      await updateTask(idUpdate, args.slice(2).join(" "));
      break;

    case "delete":
      if (args.length < 2) {
        console.error("Error: Missing task ID.");
        return;
      }
      const idDelete = parseInt(args[1]);
      if (isNaN(idDelete)) {
        console.error("Error: Task ID must be an integer.");
        return;
      }
      await deleteTask(idDelete);
      break;

    case "mark-in-progress":
      if (args.length < 2) {
        console.error("Error: Missing task ID.");
        return;
      }
      const idProgress = parseInt(args[1]);
      if (isNaN(idProgress)) {
        console.error("Error: Task ID must be an integer.");
        return;
      }
      await markStatus(idProgress, "in-progress");
      break;

    case "mark-done":
      if (args.length < 2) {
        console.error("Error: Missing task ID.");
        return;
      }
      const idDone = parseInt(args[1]);
      if (isNaN(idDone)) {
        console.error("Error: Task ID must be an integer.");
        return;
      }
      await markStatus(idDone, "done");
      break;

    case "list":
      if (args.length === 1) {
        await listTasks();
      } else if (args.length === 2) {
        const status = args[1] as TaskStatus;
        if (!["todo", "in-progress", "done"].includes(status)) {
          console.error("Error: Invalid status. Use 'todo', 'in-progress', or 'done'.");
          return;
        }
        await listTasks(status);
      } else {
        console.error("Error: Too many arguments after 'list'.");
      }
      break;

    default:
      console.error(`Error: Unknown command '${command}'.`);
  }
}

await main();