# Copyright (c) Alex Ellis 2017. All rights reserved.
# Copyright (c) OpenFaaS Author(s) 2018. All rights reserved.
# Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sys
from function import handler

def get_stdin():
    buf = ""
    for line in sys.stdin:
        buf = buf + line
    return buf

if __name__ == "__main__":
    st = get_stdin()
    ret = handler.handle(st)
    try:
        if ret != None:
            exec(open(ret).read())
        else:
            print('Error: %s' % st)
    except Exception as e:
        print('Error: %s' % str(e))
