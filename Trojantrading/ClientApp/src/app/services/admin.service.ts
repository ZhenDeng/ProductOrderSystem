import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators/catchError';
import { UserResponse, ApiResponse } from '../models/ApiResponse';
import { User } from '../Models/User';

@Injectable()
export class AdminService {

  base_url: string = "api/Admin";

  constructor(private http: HttpClient) { }

  GetUserByAccount(userName: string): Observable<UserResponse> {
    return this.http.get(this.base_url + "/GetUserByAccount?userName=" + userName)
      .pipe(catchError(this.handleError));
  }

  UpdateUser(user: User): Observable<ApiResponse> {
    return this.http.post(this.base_url + "/UpdateUser", user)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('server error:', error);
    if (error.error instanceof ErrorEvent) {
      let errMessage = '';
      try {
        errMessage = error.error.message;
      } catch (err) {
        errMessage = error.statusText;
      }
      return Observable.throw(errMessage);
    }
    return Observable.throw(error.error || 'ASP.NET Core server error');
  }
}
