import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../app.module';
import { User } from '../../../modules/user/entities/user.entity';
import { Role } from '../../../modules/user/entities/role.entity';

async function bootstrap() {
  // Create a standalone NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  // Retrieve the TypeORM DataSource from the DI container
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);

  console.log('Seeding admin role...');
  let adminRole = await roleRepository.findOneBy({ name: 'admin' });
  if (!adminRole) {
    adminRole = roleRepository.create({
      name: 'admin',
      description: 'Administrator role',
    });
    await roleRepository.save(adminRole);
    console.log('Created admin role.');
  } else {
    console.log('Admin role already exists.');
  }

  console.log('Seeding admin user...');
  const adminEmail = 'kukulyak.taras@gmail.com';
  let adminUser = await userRepository.findOne({
    where: { email: adminEmail },
    relations: { roles: true },
  });

  if (!adminUser) {
    adminUser = userRepository.create({
      email: adminEmail,
      isEmailVerified: true,
      isActive: true,
      roles: [adminRole],
    });
    await userRepository.save(adminUser);
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log(`Admin user ${adminEmail} already exists.`);

    // Ensure the admin role is assigned if the user existed but didn't have it
    const hasAdminRole = adminUser.roles?.some((role) => role.name === 'admin');
    if (!hasAdminRole) {
      adminUser.roles = [...(adminUser.roles || []), adminRole];
      await userRepository.save(adminUser);
      console.log(`Assigned admin role to existing user: ${adminEmail}`);
    }
  }

  console.log('Seeding completed successfully!');
  // Close the application context
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seeding failed!', err);
  process.exit(1);
});
