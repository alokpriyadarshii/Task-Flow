import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@taskflow.local';
  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: 'Admin' },
    create: { name: 'Admin', email, passwordHash, role: 'ADMIN' as any },
  });

  const projectId = '11111111-1111-1111-1111-111111111111';

  const project = await prisma.project.upsert({
    where: { id: projectId },
    update: { name: 'Demo Project' },
    create: {
      id: projectId,
      name: 'Demo Project',
      owner: { connect: { id: user.id } },
      members: {
        create: {
          role: 'OWNER' as any,
          user: { connect: { id: user.id } },
        },
      },
    },
  });

  console.log(JSON.stringify({ ok: true, email, password, projectId: project.id }, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
