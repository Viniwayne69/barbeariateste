import { promises as fs } from "fs";
import path from "path";
import type { Appointment } from "./booking";

const dataDirectory = path.join(process.cwd(), "data");
const appointmentsPath = path.join(dataDirectory, "appointments.json");

let queue = Promise.resolve();

async function ensureStorage() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(appointmentsPath);
  } catch {
    await fs.writeFile(appointmentsPath, "[]", "utf8");
  }
}

export async function readAppointments(): Promise<Appointment[]> {
  await ensureStorage();
  const raw = await fs.readFile(appointmentsPath, "utf8");
  return JSON.parse(raw) as Appointment[];
}

export async function writeAppointments(appointments: Appointment[]) {
  await ensureStorage();
  await fs.writeFile(
    appointmentsPath,
    `${JSON.stringify(appointments, null, 2)}\n`,
    "utf8",
  );
}

export async function withAppointmentLock<T>(task: () => Promise<T>) {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
