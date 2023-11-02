class ListComponent {
    constructor(target, props) {
      this.target = target;
      this.props = props;
      this.setup();
      this.render();
      this.mounted();
    }
    setup() {}
    render() {
        var data = this.props
        var list = ""
        if (data.length == 0) {
            list = '<tr><td class="overlay hidden">No Data</td></tr>'
        }

        data.map((item, index) => {
            list += this.template(item, index)
        })
        this.target.innerHTML = list
    }
    mounted() {}
    updated() {}
  }


export class VNetListComp extends ListComponent {
    constructor(target, props) {
        super(target, props);
    }

    template(item, index) {
        return `<tr onclick="mcpjs['network/vnetmng'].detailVpc('${item.name}', 'dtl');">
        <td class="overlay hidden column-50px" data-th="">
        <input type="hidden" id="sg_info_${index}" value="${item.name}"/>
        <input type="checkbox" name="chk" value="${item.name}" id="raw_${index}" title="" /><label for="td_ch1"></label> <span class="ov off"></span>
        <input type="hidden" value="${item.systemLabel}"/>
        </td>
        <td class="btn_mtd ovm" data-th="name">${item.name}<span class="ov"></span></td>
        <td class="overlay hidden" data-th="cidrBlock">${item.cidrBlock}</td>
        <td class="overlay hidden" data-th="description">${item.description}</td>
        </tr>`
    }
}


export class SecurityGroupListComp extends ListComponent {
    constructor(target, props) {
        super(target, props);
    }

    template(item, index) {
        return `<tr onclick="mcpjs['securitygroup/securitygroupmng'].showSecurityGroupInfo('${item.id}');">
        <td class="overlay hidden column-50px" data-th="">
        <input type="hidden" id="sg_info_${index}" value="${item.name}"/>
        <input type="checkbox" name="chk" value="${item.cspSecurityGroupName}" id="raw_${index}" title="" /><label for="td_ch1"></label> <span class="ov off"></span>
        <input type="hidden" value="${item.systemLabel}"/>
        </td>
        <td class="btn_mtd ovm" data-th="name">${item.name}<span class="ov"></span></td>
        <td class="btn_mtd ovm" data-th="name">${item.cspSecurityGroupName}<span class="ov"></span></td>
        <td class="overlay hidden" data-th="description">${item.description}</td>
        </tr>`
    }
}

export class VmSpecListComp extends ListComponent {
    constructor(target, props) {
        super(target, props);
    }

    template(item, index) {
        return `<tr onclick="mcpjs['vmspec/vmspecmng'].showVmSpecInfo('${item.id}');">
        <td class="overlay hidden column-50px" data-th="">
        <input type="hidden" id="spec_info_${index}" value="${item.name}"/>        
        <input type="checkbox" name="chk" value="${item.name}" id="raw_${index}" title="" /><label for="td_ch1"></label> <span class="ov off"></span>
        <input type="hidden" value="${item.systemLabel}"/>
        </td>
        <td class="btn_mtd ovm" data-th="name">${item.name}<span class="ov"></span></td>
        <td class="btn_mtd ovm" data-th="cspSpecName">${item.cspSpecName}<span class="ov"></span></td>
        <td class="btn_mtd ovm" data-th="vCpu">${item.numvCPU}<span class="ov"></span></td>
        <td class="overlay hidden" data-th="mem">${item.memGiB}</td>
        </tr>`
    }
}

export class VmImageListComp extends ListComponent {
    constructor(target, props) {
        super(target, props);
    }

    template(item, index) {
        return `<tr onclick="mcpjs['vmimage/vmimagemng'].showVirtualMachinImageInfo('${item.id}');">
        <td class="overlay hidden column-50px" data-th="">
        <input type="hidden" id="img_info_${index}" value="${item.name}|${item.cspImageId}"/>        
        <input type="checkbox" name="chk" value="${item.name}" id="raw_${index}" title="" /><label for="td_ch1"></label> <span class="ov off"></span>
        <input type="hidden" value="${item.systemLabel}"/>
        </td>
        <td class="btn_mtd ovm" data-th="name">${item.name}<span class="ov"></span></td>
        <td class="btn_mtd ovm" data-th="cspImageId">${item.cspImageId}<span class="ov"></span></td>
        <td class="overlay hidden" data-th="description">${item.description}</td>
        </tr>`
    }
}

export class MyImageListComp extends ListComponent {
    constructor(target, props) {
        super(target, props);
    }

    // 왜 이름이 dataDisk지?? myImage로 바꿔야 하나..
    template(item, index) {
        return `<tr onclick="mcpjs['myimage/myimagemng'].showMyImageInfo('${item.id}', '${item.name}');">
        <td class="overlay hidden column-50px" data-th="">
        <input type="hidden" id="dataDisk_info_${index}" value="${item.name}"/>        
        <input type="checkbox" name="chk" value="${item.id}" id="raw_${index}" title="" item="${item.name}" imageStatus="${item.status}"/><label for="td_ch1"></label> <span class="ov off"></span>
        <input type="hidden" value="${item.systemLabel}"/>
        </td>
        <td class="btn_mtd ovm" data-th="name">${item.name}<span class="ov"></span></td>
        <td class="overlay hidden" data-th="diskType">${item.sourceVmId}</td>        
        <td class="overlay hidden" data-th="status">${item.status}</td>
        <td class="overlay hidden" data-th="description">${item.description}</td>
        </tr>`
    }
}

export class DataDiskListComp extends ListComponent {
    constructor(target, props) {
        super(target, props);
    }

    // 왜 이름이 dataDisk지?? myImage로 바꿔야 하나..
    template(item, index) {
        return `<tr onclick="mcpjs['datadisk/datadiskmng'].showDataDiskInfo('${item.id}', '${item.name}');">
        <td class="overlay hidden column-50px" data-th="">
        <input type="hidden" id="dataDisk_info_${index}" value="${item.name}"/>        
        <input type="checkbox" name="chk" value="${item.id}" id="raw_${index}" title="" item="${item.connectionName}" diskName="${item.name}" diskStatus="${item.status}"/><label for="td_ch1"></label> <span class="ov off"></span>
        <input type="hidden" value="${item.systemLabel}"/>
        </td>
        <td class="btn_mtd ovm" data-th="name">${item.name}<span class="ov"></span></td>
        <td class="overlay hidden" data-th="diskType">${item.diskType}</td>        
        <td class="overlay hidden" data-th="diskSize">${item.diskSize}</td>
        <td class="overlay hidden" data-th="attachedVm">${item.associatedObjectList}</td>
        <td class="overlay hidden" data-th="description">${item.description}</td>
        </tr>`
    }
}


// Namespace에서 사용 가능한 vmImage 목록
export class NamespaceVmImageListComp extends ListComponent {
    constructor(target, props) {
        super(target, props);
    }

    
    template(item, index) {
        return `<tr onclick="mcpjs['vmimage/namespacevmimage_modal'].setAssistValue('${index}');">
        <input type="hidden" id="ani_id_${index}" value="${item.id}"/>
        <input type="hidden" id="ani_name_${index}" value="${item.name}"/>
        <input type="hidden" id="ani_providerId_${index}" value="${item.providerId}"/>
        <input type="hidden" id="ani_regionName_${index}" value="${item.regionName}"/>
        <input type="hidden" id="ani_connectionName_${index}" value="${item.connectionName}"/>
        <input type="hidden" id="ani_cspImageId_${index}" value="${item.cspImageId}"/>
        <input type="hidden" id="ani_cspImageName_${index}" value="${item.cspImageName}"/>
        <input type="hidden" id="ani_guestOS_${index}" value="${item.guestOS}"/>
        <input type="hidden" id="ani_description_${index}" value="${item.description}"/>        
        <td class="overlay hidden" data-th="Name">${item.name}</td>        
        <td class="overlay hidden" data-th="CspImageName">${item.cspImageName}</td>
        <td class="overlay hidden" data-th="CspImageId">${item.cspImageId}</td>
        </tr>`
    }
}

// namespace에서 사용가능한 vm spec 목록
export class NamespaceVmSpecListComp extends ListComponent {
    constructor(target, props) {
        super(target, props);
    }

    template(item, index) {
        return `<tr onclick="mcpjs['vmspec/namespacevmspec_modal'].setAssistValue('${index}');">
        <input type="hidden" id="vmSpecAssist_id_${index}" value="${item.id}"/>
        <input type="hidden" id="vmSpecAssist_name_${index}" value="${item.name}"/>
        <input type="hidden" id="vmSpecAssist_cspSpecName_${index}" value="${item.cspSpecName}"/>
        <input type="hidden" id="vmSpecAssist_memGiB_${index}" value="${item.memGiB}"/>
        <input type="hidden" id="vmSpecAssist_numvCPU_${index}" value="${item.numvCPU}"/>
        <input type="hidden" id="vmSpecAssist_numGpu_${index}" value="${item.numGpu}"/>
        <input type="hidden" id="vmSpecAssist_connectionName_${index}" value="${item.connectionName}"/>
        <input type="hidden" id="vmSpecAssist_providerId_${index}" value="${item.providerId}"/>
        <input type="hidden" id="vmSpecAssist_regionName_${index}" value="${item.regionName}"/>
        <td class="overlay hidden" data-th="Name">${item.name}</td>        
        <td class="overlay hidden" data-th="CspSpecName">${item.cspSpecName}</td>
        <td class="btn_mtd ovm td_left" data-th="Memory">${item.memGiB}</td>
        <td class="overlay hidden" data-th="VCPU">${item.numvCPU}</td>
        <td class="overlay hidden" data-th="GPU">${item.numGpu}</td>
        </tr>`
    }
}


export class NamespaceVpcListComp extends ListComponent {
    constructor(target, props) {
        super(target, props);
    }
    
    template(item, index) {
        return `<tr onclick="mcpjs['network/namespacevpc_modal'].setAssistValue('${index}');">
        <input type="hidden" id="vNetAssist_id_${index}" value="${item.id}"/>
        <input type="hidden" id="vNetAssist_name_${index}" value="${item.name}"/>
        <input type="hidden" id="vNetAssist_description_${index}" value="${item.description}"/>
        <input type="hidden" id="vNetAssist_cidrBlock_${index}" value="${item.cidrBlock}"/>
        <input type="hidden" id="vNetAssist_cspVnetName_${index}" value="${item.cspVNetName}"/>
        <input type="hidden" id="vNetAssist_subnetId_${index}" value="${item.subnetInfoList[0].id}"/>
        <input type="hidden" id="vNetAssist_subnetName_${index}" value="${item.subnetInfoList[0].id}"/>

        <input type="hidden" id="vNetAssist_connectionName_${index}" value="${item.connectionName}"/>
        <input type="hidden" id="vNetAssist_providerId_${index}" value="${item.providerId}"/>
        <input type="hidden" id="vNetAssist_regionName_${index}" value="${item.regionName}"/>

        <td class="overlay hidden" data-th="Name">${item.name}</td>        
        <td class="overlay hidden" data-th="CidrBlock">${item.cidrBlock}</td>
        <td class="btn_mtd ovm td_left" data-th="SubnetId">${item.subnetInfoList}<br>${item.subnetInfoLis}</td>
        <td class="overlay hidden" data-th="Description">${item.description}</td>
        </tr>`
    }
}


export class NamespaceSecurityGroupListComp extends ListComponent {
    constructor(target, props) {
        super(target, props);
    }
    
    template(item, index) {
        return `<tr>
        <td class="overlay hidden column-50px" data-th="">
            <input type="checkbox" name="securityGroupAssist_chk" id="securityGroupAssist_Raw_${index}"/>
        
            <input type="hidden" id="securityGroupAssist_id_${index}" value="${item.id}"/>
            <input type="hidden" id="securityGroupAssist_name_${index}" value="${item.name}"/>
            <input type="hidden" id="securityGroupAssist_description_${index}" value="${item.description}"/>
            <input type="hidden" id="securityGroupAssist_vNetId_${index}" value="${item.vNetId}"/>
            <input type="hidden" id="securityGroupAssist_cspSecurityGroupId_${index}" value="${item.cspSecurityGroupId}"/>
            <input type="hidden" id="securityGroupAssist_cspSecurityGroupName_${index}" value="${item.cspSecurityGroupName}"/>
            <input type="hidden" id="securityGroupAssist_firewallRules_cidr_${index}" value="${item.firewallRules[0].cidr}"/>
            <input type="hidden" id="securityGroupAssist_firewallRules_direction_${index}" value="${item.firewallRules[0].direction}"/>
            <input type="hidden" id="securityGroupAssist_firewallRules_fromPort_${index}" value="${item.firewallRules[0].fromPort}"/>
            <input type="hidden" id="securityGroupAssist_firewallRules_toPort_${index}" value="${item.firewallRules[0].toPort}"/>
            <input type="hidden" id="securityGroupAssist_firewallRules_ipProtocol_${index}" value="${item.firewallRules[0].ipProtocol}"/>

            <input type="hidden" id="securityGroupAssist_providerId_${index}" value="${item.providerId}"/>
            <input type="hidden" id="securityGroupAssist_regionName_${index}" value="${item.regionName}"/>
            <input type="hidden" id="securityGroupAssist_connectionName_${index}" value="${item.connectionName}"/>
        </td>
        <td class="overlay hidden" data-th="Name">${item.name}</td>        
        <td class="overlay hidden" data-th="VNetId">${item.vNetId}</td>
        <td class="overlay hidden" data-th="Description">${item.description}</td>
        </tr>`
    }
}

export class NamespaceSshKeyListComp extends ListComponent {
    constructor(target, props) {
        super(target, props);
    }
    
    template(item, index) {
        return `<tr onclick="mcpjs['sshkey/namespacesshkey_modal'].setAssistValue('${index}');">
        <input type="hidden" id="sshKeyAssist_id_${index}" value="${item.id}"/>
        <input type="hidden" id="sshKeyAssist_name_${index}" value="${item.name}"/>
        <input type="hidden" id="sshKeyAssist_description_${index}" value="${item.description}"/>
        <input type="hidden" id="sshKeyAssist_connectionName_${index}" value="${item.connectionName}"/>
        
        <td class="overlay hidden" data-th="Name">${item.name}</td>        
        <td class="overlay hidden" data-th="Provider">${item.providerId}</td>
        <td class="btn_mtd ovm td_left" data-th="Region">${item.regionName}</td>
        <td class="overlay hidden" data-th="Description">${item.description}</td>
        </tr>`
    }
}
