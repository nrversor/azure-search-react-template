import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { SearchClient, AzureKeyCredential, SearchOptions } from "@azure/search-documents";

const indexName = process.env["SearchIndexName"];
const apiKey = process.env["SearchApiKey"];
const searchServiceName = process.env["SearchServiceName"];

// Create a SearchClient to send queries
const client = new SearchClient(
    `https://` + searchServiceName + `.search.windows.net/`,
    indexName,
    new AzureKeyCredential(apiKey)
);

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    //context.log(req);

    // Reading inputs from HTTP Request
    var q = (req.query.q || (req.body && req.body.q));
    const top = (req.query.top || (req.body && req.body.top));
    const skip = (req.query.skip || (req.body && req.body.skip));
    const filters = (req.query.filters || (req.body && req.body.filters));
    const facets = process.env["Facets"].split(",");
    //var resultFields: string[] = process.env["ResultFields"].split(",");

    // Creating SearchOptions for query
    // Values after ?? are used if parameters are undefined
    var searchOptions: SearchOptions<never> = {
        top: top ?? 10,
        skip: skip ?? 0,
        includeTotalCount: true,
        facets: facets ?? []
    }

    if (filters && filters.length > 0) {
        searchOptions.filter = filters;
    }

    // If search term is empty, search everything
    if (!q || q === "") {
        q = "*";
    }

    // Sending the search request
    const searchResults = await client.search(q, searchOptions);

    // Getting results for output
    var output = []
    for await (const result of searchResults.results) {
        output.push(result);
    }

    // Logging search results
    context.log(searchResults);

    // Creating the HTTP Response
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: { 
            count: searchResults.count, 
            results: output, 
            facets: searchResults.facets
        }
    };

};

export default httpTrigger;