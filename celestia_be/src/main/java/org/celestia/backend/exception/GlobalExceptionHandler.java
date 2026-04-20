package org.celestia.backend.exception;


import org.celestia.backend.dto.ErrorMessage;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(value=UserAlreadyExistException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public @ResponseBody ErrorMessage userAlreadyExistException(UserAlreadyExistException e) {
        return new ErrorMessage(HttpStatus.CONFLICT.value(),e.getMessage());
    }

    @ExceptionHandler(value= InvalidCredentialsException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public @ResponseBody ErrorMessage invalidCredentialsException(InvalidCredentialsException e) {
        return new ErrorMessage(HttpStatus.BAD_REQUEST.value(),e.getMessage());
    }

}
