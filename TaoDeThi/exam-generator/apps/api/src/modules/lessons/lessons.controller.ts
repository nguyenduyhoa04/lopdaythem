import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as path from 'path';
import * as fs from 'fs';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

function getUploadsDir(): string {
  const cwd = process.cwd();
  let uploadsPath = path.join(cwd, 'apps', 'api', 'public', 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    const altPath = path.join(cwd, 'public', 'uploads');
    if (fs.existsSync(altPath)) {
      uploadsPath = altPath;
    } else {
      uploadsPath = path.join(cwd, 'apps', 'api', 'public', 'uploads');
    }
  }
  return uploadsPath;
}

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.create(createLessonDto);
  }

  @Get()
  findAll(
    @Query('subjectId') subjectId?: string,
    @Query('gradeId') gradeId?: string,
  ) {
    return this.lessonsService.findAll(subjectId, gradeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto) {
    return this.lessonsService.update(id, updateLessonDto);
  }

  @Patch(':id/resource')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = getUploadsDir();
          fs.mkdirSync(uploadDir, { recursive: true });
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const safeName = `lesson-resource-${Date.now()}${extname(file.originalname)}`;
          cb(null, safeName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (
          !file.mimetype.startsWith('image/') &&
          !file.mimetype.startsWith('application/') &&
          !file.mimetype.startsWith('text/')
        ) {
          return cb(
            new Error('Chỉ cho phép upload file ảnh hoặc tài liệu'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadResource(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      `http://localhost:${process.env.PORT ?? 3000}`;
    const resourceUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${file.filename}`;
    return this.lessonsService.uploadResource(
      id,
      resourceUrl,
      file.originalname,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lessonsService.remove(id);
  }
}
