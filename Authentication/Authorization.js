
module.exports = function(options) {

//{resource:"cluster", action:"read"}//


    var middleware = function(req, res, next) {

        var resource = options.resource;
        var action = options.action;


        ///////////////////////fix company info/////////////////////////////////////////////////////////////////////////////////
        if(req.user.company && req.user.tenant && req.user.company == -1 && req.user.tenant == -1 && req.headers['companyinfo'] ){

            var arr = req.headers['companyinfo'].split(":");
            if(arr.length > 1){

                req.user.tenant =  arr[0];
                req.user.company =  arr[1];
            }
        }


        if(req.user.scope ) {


            /*
            var index = req.user.scope.indexOf("all");
            if(index > 0){
                next();
            }*/

            var globalselector = req.user.scope.filter(function (item) {

                return item.resource == "all";

            });



            if(globalselector && globalselector.length > 0){

                next();

            }else {


                if (resource) {
                    var selected = req.user.scope.filter(function (item) {

                        return item.resource == resource;

                    });

                    if (selected && selected.length > 0) {

                        var actions = selected[0].actions;
                        if (action) {

                            var index1 = actions.indexOf(action);
                            if (index1 > -1) {

                                next();


                            } else {

                                next(new Error('insufficient scopes'));

                            }


                        } else {
                            next();

                        }


                    } else {

                        next(new Error('insufficient scopes'));

                    }
                } else {

                    next();


                }
            }

        }else{

            next(new Error('insufficient scopes'));

        }


    };



    return middleware;
};

