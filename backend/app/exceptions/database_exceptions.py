class DatabaseException(Exception):
    pass

class ConnectionException(DatabaseException):
    pass

class QueryException(DatabaseException):
    pass
