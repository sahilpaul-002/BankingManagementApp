const executeBaseQuery = async (
    baseQuery: any,
    args: any
) => {
    const result = await baseQuery(args);

    if (result.error) {
        throw result.error;
    }

    return result;
};

export default executeBaseQuery;