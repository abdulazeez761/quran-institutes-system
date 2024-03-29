import { ResponseFromServiceI } from './../../../shared/interfaces/general/response-from-service.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { InjectModel } from '@nestjs/mongoose';
import { SCHEMAS } from '@shared/constants/schemas.constant';
import { Model } from 'mongoose';
import { InstitutesService } from '../institutes/institutes.service';
import { DivisionDocument } from './types/division-document.type';
import { UserDocument } from '@modules/system-users/users/types/user-document.type';
import { Role } from '@shared/enums/role.enum';
import { InstituteManagersService } from '@modules/system-users/institute-managers/institute-managers.service';
import { StudentsService } from '@modules/system-users/students/students.service';
import { TeachersService } from '@modules/system-users/teachers/teachers.service';

@Injectable()
export class DivisionsService {
  constructor(
    @InjectModel(SCHEMAS.DIVISION)
    private readonly divisionModel: Model<DivisionDocument>,
    private readonly institutesService: InstitutesService,
    private readonly instituteManagersService: InstituteManagersService,
    private readonly stduentsService: StudentsService,
    private readonly teachersService: TeachersService,
  ) {}
  async create(
    createDivisionDto: CreateDivisionDto,
    institutesID: string,
    isntituteManagerID: string,
  ) {
    const [institute, instituteManager] = await Promise.all([
      this.institutesService.findInstituteByID(institutesID),
      this.instituteManagersService.findInstituteManagerByID(
        isntituteManagerID,
      ),
    ]);
    if (!instituteManager)
      throw new HttpException(
        'what are you trying to do !-_-',
        HttpStatus.BAD_REQUEST,
      );
    if (!institute)
      throw new HttpException("institute Doesn't exist!", HttpStatus.NOT_FOUND);
    if (
      !institute.instituteManagers?.includes(
        isntituteManagerID as unknown as UserDocument,
      ) &&
      instituteManager.role !== Role.SUPER_ADMIN
    )
      throw new HttpException(
        'you are not an admin of this institute!',
        HttpStatus.BAD_REQUEST,
      );

    const divisionToCreate = new this.divisionModel(createDivisionDto);
    divisionToCreate.institute = institute;
    divisionToCreate.students = [];
    divisionToCreate.teachers = [];
    divisionToCreate.author = instituteManager;

    institute.divisions?.push(
      divisionToCreate._id as unknown as DivisionDocument,
    );
    const createdDivision = await divisionToCreate.save();

    instituteManager.instituteManagerProperties?.createdDivisions.push(
      divisionToCreate._id as unknown as DivisionDocument,
    );

    await Promise.all([institute.save(), instituteManager.save()]);

    return {
      data: createdDivision.toObject({
        flattenObjectIds: true,
        depopulate: true,
      }),
      httpStatus: HttpStatus.CREATED,
      message: {
        translationKey: 'shared.success.create',
        args: { entity: 'entities.division' },
      },
    };
  }

  async addStudent(
    divisionID: string,
    studentID: string,
    instituteManagerID: string,
  ): Promise<ResponseFromServiceI<DivisionDocument>> {
    const [division, student, instituteManager] = await Promise.all([
      this.findDivivsionByID(divisionID),
      this.stduentsService.findStudentByID(studentID),
      this.instituteManagersService.findInstituteManagerByID(
        instituteManagerID,
      ),
    ]);
    if (!division)
      throw new HttpException('division does not exist', HttpStatus.NOT_FOUND);

    if (!student)
      throw new HttpException('student does not exist', HttpStatus.NOT_FOUND);

    if (!instituteManager)
      throw new HttpException(
        'what are you trying to do!',
        HttpStatus.BAD_REQUEST,
      );

    if (
      division.students?.includes(student._id as unknown as UserDocument) ||
      student.studentProperties?.divisions.includes(
        division._id as unknown as DivisionDocument,
      )
    )
      throw new HttpException('student already exist!', HttpStatus.BAD_REQUEST);

    division.students?.push(student._id as unknown as UserDocument);
    student.studentProperties?.divisions.push(
      division._id as unknown as DivisionDocument,
    );
    const [updatedDivision, _] = await Promise.all([
      division.save(),
      student.save(),
    ]);
    return {
      data: updatedDivision.toJSON({
        flattenObjectIds: true,
        depopulate: true,
      }),
      httpStatus: HttpStatus.CREATED,
      message: {
        translationKey: 'shared.success.update',
        args: { entity: 'entities.division' },
      },
    };
  }

  async addTeacher(
    divisionID: string,
    teacherID: string,
    instituteManagerID: string,
  ): Promise<ResponseFromServiceI<DivisionDocument>> {
    const [division, teacher, instituteManager] = await Promise.all([
      this.findDivivsionByID(divisionID),
      this.teachersService.findTeacherByID(teacherID),
      this.instituteManagersService.findInstituteManagerByID(
        instituteManagerID,
      ),
    ]);

    if (!division)
      throw new HttpException('division does not exist', HttpStatus.NOT_FOUND);

    if (!teacher)
      throw new HttpException('teacher does not exist', HttpStatus.NOT_FOUND);

    if (!instituteManager)
      throw new HttpException(
        'what are you trying to do!',
        HttpStatus.BAD_REQUEST,
      );

    if (
      division.teachers?.includes(teacher._id as unknown as UserDocument) ||
      teacher.teacherProperties?.divisions.includes(
        division._id as unknown as DivisionDocument,
      )
    )
      throw new HttpException('teacher already exist!', HttpStatus.BAD_REQUEST);

    division.teachers?.push(teacher._id as unknown as UserDocument);
    teacher.teacherProperties?.divisions.push(
      division._id as unknown as DivisionDocument,
    );
    const [updatedDivision, _] = await Promise.all([
      division.save(),
      teacher.save(),
    ]);
    return {
      data: updatedDivision.toJSON({
        flattenObjectIds: true,
        depopulate: true,
      }),
      httpStatus: HttpStatus.CREATED,
      message: {
        translationKey: 'shared.success.update',
        args: { entity: 'entities.division' },
      },
    };
  }
  findAll() {
    return `This action returns all divisions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} division`;
  }

  update(id: number, updateDivisionDto: UpdateDivisionDto) {
    return `This action updates a #${id} ${updateDivisionDto} division`;
  }

  remove(id: number) {
    return `This action removes a #${id} division`;
  }
  async findDivivsionByID(
    divisionID: string,
  ): Promise<DivisionDocument | null> {
    return this.divisionModel.findById<DivisionDocument>(divisionID);
  }
}
