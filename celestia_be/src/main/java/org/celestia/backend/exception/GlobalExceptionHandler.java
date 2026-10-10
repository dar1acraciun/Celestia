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

    @ExceptionHandler(value = ConstellationNotFound.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public @ResponseBody ErrorMessage constellattionNotFoundException(ConstellationNotFound e) {
        return new ErrorMessage(HttpStatus.NOT_FOUND.value(),e.getMessage());
    }

    @ExceptionHandler(value = InvalidSkyChatRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public @ResponseBody ErrorMessage invalidSkyChatRequestException(InvalidSkyChatRequestException e) {
        return new ErrorMessage(HttpStatus.BAD_REQUEST.value(), e.getMessage());
    }

    @ExceptionHandler(value = org.springframework.http.converter.HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public @ResponseBody ErrorMessage httpMessageNotReadableException(
            org.springframework.http.converter.HttpMessageNotReadableException e) {
        return new ErrorMessage(HttpStatus.BAD_REQUEST.value(), e.getMessage());
    }

    @ExceptionHandler(value = ClassCastException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public @ResponseBody ErrorMessage classCastException(ClassCastException e) {
        return new ErrorMessage(HttpStatus.UNAUTHORIZED.value(), "Unauthorized");
    }

    @ExceptionHandler(value = Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public @ResponseBody ErrorMessage genericException(Exception e) {
        return new ErrorMessage(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Internal server error");
    }

}
