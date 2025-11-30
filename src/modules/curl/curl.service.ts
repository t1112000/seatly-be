import { Inject, Injectable } from '@nestjs/common';
import {
  GetCurlPayloadDto,
  PostCurlPayloadDto,
  PutCurlPayloadDto,
  DeleteCurlPayloadDto,
  PatchCurlPayloadDto,
} from './curl.dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as qs from 'qs';
import { isEmpty } from 'lodash';

@Injectable()
export class CurlService {
  private config: Record<string, any> = {};

  constructor(@Inject(HttpService) private httpService: HttpService) {
    this.config = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip,deflate,compress',
      },
    };
  }

  async get(payload: GetCurlPayloadDto) {
    try {
      const queryString = qs.stringify(payload.query, {
        encodeValuesOnly: true,
      });
      return await lastValueFrom(
        this.httpService.get(
          payload.url + (payload.query ? `?${queryString}` : ''),
          {
            headers: {
              ...this.config.headers,
              ...payload.addheaders,
              ...(payload.token && {
                Authorization: `${
                  payload?.bearer ? 'Bearer ' + payload.token : payload.token
                }`,
              }),
            },
            ...payload.another_config,
            params: payload.params,
            timeout: payload?.timeout || 120000,
          },
        ),
      );
    } catch (error) {
      throw error;
    }
  }

  async post(payload: PostCurlPayloadDto) {
    try {
      return await lastValueFrom(
        this.httpService.post(payload.url, payload.data, {
          headers: {
            ...this.config.headers,
            ...payload.addheaders,
            ...(payload.token && {
              Authorization: `${
                payload?.bearer ? 'Bearer ' + payload.token : payload.token
              }`,
            }),
          },
          timeout: payload?.timeout || 120000,
        }),
      );
    } catch (error) {
      throw error;
    }
  }

  async put(payload: PutCurlPayloadDto) {
    try {
      return await lastValueFrom(
        this.httpService.put(payload.url, payload.data, {
          headers: {
            ...this.config.headers,
            ...payload.addheaders,
            ...(payload.token && {
              Authorization: `${
                payload?.bearer ? 'Bearer ' + payload.token : payload.token
              }`,
            }),
          },
          timeout: payload?.timeout || 120000,
        }),
      );
    } catch (error) {
      throw error;
    }
  }

  async delete(payload: DeleteCurlPayloadDto) {
    try {
      return await lastValueFrom(
        this.httpService.delete(payload.url, {
          headers: {
            ...this.config.headers,
            ...payload.addheaders,
            ...(payload.token && {
              Authorization: `${
                payload?.bearer ? 'Bearer ' + payload.token : payload.token
              }`,
            }),
          },
          ...(!isEmpty(payload.data) && { data: payload.data }),
          timeout: payload?.timeout || 120000,
        }),
      );
    } catch (error) {
      throw error;
    }
  }

  async patch(payload: PatchCurlPayloadDto) {
    try {
      return await lastValueFrom(
        this.httpService.patch(payload.url, payload.data, {
          headers: {
            ...this.config.headers,
            ...payload.addheaders,
            ...(payload.token && {
              Authorization: `${
                payload?.bearer ? 'Bearer ' + payload.token : payload.token
              }`,
            }),
          },
          timeout: payload?.timeout || 120000,
        }),
      );
    } catch (error) {
      throw error;
    }
  }
}
