import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as process from 'node:process';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { engine } from 'express-handlebars';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const PORT: number = parseInt(process.env.PORT) || 3000;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  // app.setGlobalPrefix('api');

  // const sequelize = app.get(Sequelize);
  // await sequelize.sync({ force: true });
  // await Participant.sync({ force: true });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setViewEngine('hbs');
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));

  app.engine(
    'hbs',
    engine({
      extname: 'hbs',
      runtimeOptions: {
        allowProtoPropertiesByDefault: true,
      },
      defaultLayout: false,
      helpers: {
        and: (a, b) => a && b,
        eq: (a, b) => a === b,
        not: (a) => !a,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Chat application')
    .setDescription('Chat application documentation')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(PORT, () => {
    console.log(`App is listening on port - ${PORT}`);
  });
}

bootstrap();
