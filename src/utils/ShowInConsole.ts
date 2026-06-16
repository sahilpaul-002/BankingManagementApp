const ShowInConsole = (message: string, value: object | null = null) => {
    if (window.location.hostname === "localhost") {
        const stack = new Error().stack;
        const callerLine = stack?.split("\n")[2]?.trim().replace(/^at\s+/, "");

        const logObject = {
            message,
            value,
            caller: callerLine
        };

        console.log(logObject);
    }
    else {
        return;
    }
}

export default ShowInConsole;