import { Controller, Get, Render, Res } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  root(@Res() res) {
    return res.redirect('auth/login');
  }
}
