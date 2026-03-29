# -*- coding:utf-8 -*-


class Response(dict):

    def __init__(self, status, message, data):
        """
        :param status: 状态值，True 正常，False 有错误
        :param message: 错误信息
        :param data: 返回的数据
        """
        super(Response, self).__init__(status=status, message=message, data=data)


class SuccessResponse(Response):

    def __init__(self, data=None):
        if data is None:
            data = {}

        super(SuccessResponse, self).__init__(True, "", data)


class FailedResponse(Response):

    def __init__(self, message=None):
        if message is None:
            message = ""

        super(FailedResponse, self).__init__(False, message, {})
