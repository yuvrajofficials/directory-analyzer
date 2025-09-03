import { promises as fs } from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';

const config = {
    baseDir: 'heavy-module',
    fileCount: 1000,
    subfolderCount: 50,
    maxDepth: 4,
    fileSizeKB: 10,
};

// Function to generate a random file and folder structure
async function generateModule(currentPath: string, depth: number): Promise<void> {
    if (depth > config.maxDepth) {
        return;
    }

    // Create a specified number of files in the current folder
    for (let i = 0; i < config.fileCount / config.subfolderCount; i++) {
        const fileName = faker.system.fileName();
        const filePath = path.join(currentPath, fileName);
        const fileContent = faker.lorem.paragraphs(Math.round(config.fileSizeKB / 0.5));
        await fs.writeFile(filePath, fileContent, 'utf-8');
    }

    // Recursively generate subfolders
    if (depth < config.maxDepth) {
        for (let i = 0; i < config.subfolderCount / config.maxDepth; i++) {
            const folderName = faker.word.noun();
            const newPath = path.join(currentPath, folderName);
            await fs.mkdir(newPath, { recursive: true });
            await generateModule(newPath, depth + 1);
        }
    }
}

// Main function to run the generation
async function main(): Promise<void> {
    console.log('Starting module generation...');
    try {
        await fs.mkdir(config.baseDir, { recursive: true });
        await generateModule(config.baseDir, 1);
        console.log('Heavy module generated successfully.');
    } catch (error) {
        console.error('Error generating module:', error);
    }
}

main();
