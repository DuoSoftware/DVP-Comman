/**
 * Created by a on 1/28/2015.
 */
var model = require('./CsDataModel.js');

/*

 var CreateDatabase = function(){

 sequelize
 .sync({ force: true })
 .complete(function(err) {
 if (!!err) {
 console.log('An error occurred while creating the table:', err)
 } else {
 console.log('It worked!')
 }
 })

 };

 */
var ActivateCloud = function(id, activeStatus) {

    var status = 0;


    model.Cloud.update({

            Activate: activeStatus

        }, {
            ID: id
        }
    ).complete(function (err) {
            if (err) {
                console.log("Cloud model update false ->", err)
            } else {
                status = 1;
                console.log("Cloud model updated ")
            }

        })

    return status;


}

var CreateCloud = function(cloudData){

    //0 public
    //1 private
    //2 virtual
    //3 hybrid
    var model = 0;
    var status = 0;

    if(0<cloudData.CloudModel && cloudData.CloudModel<4) {

        console.log("Model is correct ");
        model = cloudData.CloudModel;

    }
    else{

        console.log("Model is incorrect trying private");

    }

    var cloud = model.Cloud.build({
        Name: cloudData.Name,
        CompanyId: cloudData.CompanyId,
        TenantId: cloudData.TenantId,
        CloudModel: model,
        Class: cloudData.Class,
        Type: cloudData.Type,
        Category: cloudData.Category,
        IsLoadBalanced: cloudData.IsLoadBalanced,
        LoadBalancerID: -1
    })


    cloud
        .save()
        .complete(function(err) {
            if (!!err) {
                console.log('The cloud instance has not been saved:', err)
            } else {
                console.log('Cloud have a persisted instance now')
                status = 1;
            }
        })

    return status;
};


var AddLoadBalancer = function(loadBalancer){

    /*
     Type: Sequelize.string,
     MainIP: Sequelize.STRING,
     ID: Sequelize.INTEGER
     */
    var status = 0;
    model.Cloud.find({ ID: loadBalancer.ID }).complete(function(err, cloudObject) {
        if(!err) {
            console.log(cloudObject)

            if(cloudObject.IsLoadBalanced) {

                var loadBalancerObject = model.LoadBalancer.build(
                    {
                        Type: loadBalancer.Type,
                        MainIP: loadBalancer.IP
                    }
                )
                loadBalancer
                    .save()
                    .complete(function(err) {

                        if(!err){

                            model.Cloud.update({

                                    LoadBalancerID:loadBalancerObject.ID

                                },{
                                    ID: loadBalancer.ID
                                }

                            ).complete(function(err) {
                                    if(err){
                                        console.log("Cloud model update false ->", err)
                                    }else {
                                        status= 1;
                                        console.log("Cloud model updated ")
                                    }

                                })

                        }else{

                            console.log("Error on loadbalancer save --> ", err);

                        }
                    }
                )
            }


        }else {

            console.log("Get Relevent cloud failed -> ", loadBalancer.ID);
        }
    })

    return status;
}