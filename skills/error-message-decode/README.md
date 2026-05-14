# error-message-decode

Takes any pasted error message, stack trace, panic, or build failure and
produces the actual cause plus the smallest fix. Identifies the frame
that touches user code (not the top of the stack), reads the message
literally, applies known decode patterns (`ECONNREFUSED`, `EADDRINUSE`,
`'NoneType' has no attribute`, etc.), and includes a verification command.
