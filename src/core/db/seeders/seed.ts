import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../app.module';
import { User } from '../../../modules/user/entities/user.entity';

async function bootstrap() {
  // Create a standalone NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  // Retrieve the TypeORM DataSource from the DI container
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);

  console.log('Seeding users...');

  // Create 2 users
  const users = userRepository.create([
    {
      email: 'user1@example.com',
      mobileNumber: '1234567890',
      isEmailVerified: true,
      isActive: true,
    },
    {
      email: 'user2@example.com',
      mobileNumber: '0987654321',
      isEmailVerified: true,
      isActive: true,
    },
  ]);

  await userRepository.save(users);
  console.log('Successfully seeded 2 users!');

  // Close the application context
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seeding failed!', err);
  process.exit(1);
});
