GReg REST API
=========

##Current state
> Unstable

##Response Format
All requests from the database are returned in JSON format with the following format:

    {
        success: Boolean,
        timestamp: ms since the Unix epoch,
        contents: {
                    ... If success, whatever it is you requested ...
                  }
    }

##GET

###Package
####/pkg/

This returns all of the package headers in the database.

####/pkgs/

This also returns all of the package headers in the database.

####/pkg/[id]

This returns the unique package header associated with that [id].

####/pkg_engine/[engine]
Returns all the packages with the given engine name. (e.g. "dynamo" or "designscript")

####/pkg_engine/[engine]/[name]

Returns the single package with the given engine name ([engine]) and package name ([name]).  This is guaranteed to be a single unique package.

###Package search

####/pkg_search/[query]

Returns the list of packages returned by keyword search ([query]) over the packages

####/pkg_search/[query]
Returns the of packages returned by keyword search ([query]) over the packages

##POST

####/pkg/
Posts a new package.  Requires an oauth authorization header validated from Oxygen.

##PUT

####/pkg/
Posts a new package version.  Requires an oauth authorization header validated from Oxygen.

####/pkg-vote/[id]
Votes for a package.  Only increments if the user is authorized and never voted for the package before.



    