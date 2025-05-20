declare const appendQueryParameter: (location: Location | any, queryParameters: {
    [key: string]: string;
}) => Location;
export { appendQueryParameter };
