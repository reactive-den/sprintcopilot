import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Projects API', () => {
  beforeEach(async () => {
    // Clean up before each test
    if (process.env.NODE_ENV === 'test') {
      await prisma.ticket.deleteMany();
      await prisma.run.deleteMany();
      await prisma.project.deleteMany();
    }
  });

  describe('POST /api/projects', () => {
    it('should create a new project with valid data', async () => {
      const projectData = {
        title: 'Test Project',
        problem: 'This is a test problem statement that needs to be solved.',
        constraints: 'Test constraints',
      };

      const project = await prisma.project.create({
        data: projectData,
      });

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.title).toBe(projectData.title);
      expect(project.problem).toBe(projectData.problem);
      expect(project.constraints).toBe(projectData.constraints);
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        title: 'Too short', // Less than 10 characters
        problem: 'Short',
      };

      await expect(
        prisma.project.create({
          data: invalidData as any,
        })
      ).rejects.toThrow();
    });
  });

  describe('GET /api/projects', () => {
    it('should return empty array when no projects exist', async () => {
      const projects = await prisma.project.findMany();
      expect(projects).toEqual([]);
    });

    it('should return all projects', async () => {
      // Create test projects
      await prisma.project.createMany({
        data: [
          {
            title: 'Project 1',
            problem: 'Problem statement for project 1',
          },
          {
            title: 'Project 2',
            problem: 'Problem statement for project 2',
          },
        ],
      });

      const projects = await prisma.project.findMany();
      expect(projects).toHaveLength(2);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return a specific project', async () => {
      const created = await prisma.project.create({
        data: {
          title: 'Test Project',
          problem: 'Test problem statement',
        },
      });

      const project = await prisma.project.findUnique({
        where: { id: created.id },
      });

      expect(project).toBeDefined();
      expect(project?.id).toBe(created.id);
    });

    it('should return null for non-existent project', async () => {
      const project = await prisma.project.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(project).toBeNull();
    });
  });
});
