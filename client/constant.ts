export const BaseUrl = import.meta.env.VITE_BASE_URL;
export const SocketUrl = import.meta.env.VITE_BASE_URL_SOCKET;

const MessageType = {
    Message: 0,
    Image: 1,
    Video: 2,
    File: 3,
    Groups: 4,
    Location: 5,
    Contact: 6,
    Document: 7,
    Audio: 8,
    Profile: 9,
    center: 10
};

const ChatType = {
    Single: 0,
    Groups: 4,
    Project: 5,
    Thread: 1,
};

const PermissionsOptions = {
    "Everyone in this group": 1,
    "only group admin and owner": 2,
    "only Owner": 0
}
const GroupMessageType = {
    invite: 0,
    add: 1,
    remove: 2,
    adminadd: 3,
    adminremove: 4,
    leave: 5
}


const GetcenterText = (type: number) => {
    var text = ""
    var second = ""
    switch (type) {
        case GroupMessageType.invite:
            text = "invited";
            second = "to the chat."
            break
        case GroupMessageType.add:
            text = "added";
            second = "to group."
            break
        case GroupMessageType.adminadd:
            text = "added";
            second = "to group administrators."
            break
        case GroupMessageType.adminremove:
            text = "removed";
            second = "from group administrators."
            break
        case GroupMessageType.remove:
            text = "removed";
            second = "from group."
            break
        case GroupMessageType.leave:
            text = "";
            second = "Leave the group."
            break
        default:
            text = "";
            second = ""
            break
    }
    return {
        first: text,
        second
    }
}


export { MessageType, ChatType, PermissionsOptions, GetcenterText, GroupMessageType }