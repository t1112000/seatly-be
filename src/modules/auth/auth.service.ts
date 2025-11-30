import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/sequelize';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Sequelize, Transaction } from 'sequelize';
import { ConfigServiceKeys } from 'src/common/constants';
import { generateJwtToken } from 'src/common/helpers/jwt.helper';
import { CurlService } from '../curl/curl.service';
import { UserService } from '../user/user.service';
import { GoogleOAuthDto } from './auth.dto';

@Injectable()
export class AuthService {
  private googleGetUserInfoUrl: string;
  constructor(
    private readonly userService: UserService,
    @InjectPinoLogger(AuthService.name)
    private logger: PinoLogger,
    @Inject(ConfigService)
    private configService: ConfigService,
    @InjectConnection()
    private sequelize: Sequelize,
    @Inject(CurlService)
    private curlService: CurlService,
  ) {
    this.googleGetUserInfoUrl =
      this.configService.get<string>(
        ConfigServiceKeys.GOOGLE_GET_USER_INFO_URL,
      ) || '';
  }

  async googleOAuth({ access_token }: GoogleOAuthDto): Promise<string> {
    const transaction: Transaction = await this.sequelize.transaction();
    try {
      const userInfo = await this.curlService.get({
        url: this.googleGetUserInfoUrl,
        token: `Bearer ${access_token}`,
      });

      if (!userInfo || !userInfo.data) {
        this.logger.error({ userInfo }, 'Error in googleOAuth');
        throw new BadRequestException('Mã truy cập không hợp lệ');
      }

      const { email, name, sub: google_id } = userInfo.data;

      let existedUser = await this.userService.findOne({ email });

      if (!existedUser) {
        const createPayload = {
          name,
          email,
          google_id,
        };

        existedUser = await this.userService.create(createPayload, {
          transaction,
        });
      }

      const token = generateJwtToken({
        id: existedUser.id,
        email: existedUser.email,
      });

      await transaction.commit();

      return token;
    } catch (error) {
      this.logger.error({ error }, 'Error in googleOAuth');
      await transaction.rollback();
      throw error;
    }
  }
}
