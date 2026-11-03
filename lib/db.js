import { promises as fs } from "fs";
import path from "path";

const dbFolder = path.join(process.cwd(), "data", "db");

// Read one JSON file. If it does not exist, return an empty list.
export async function readData(name) {
  const file = path.join(dbFolder, `${name}.json`);

  try {
    const text = await fs.readFile(file, "utf8");
    return JSON.parse(text);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

// Save the whole list back to the same JSON file.
export async function writeData(name, data) {
  const file = path.join(dbFolder, `${name}.json`);
  await fs.mkdir(dbFolder, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}