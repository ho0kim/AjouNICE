"""
REST API Resource Routing
http://flask-restplus.readthedocs.io
"""

from datetime import datetime
from flask import request
from flask_restplus import Resource
from bs4 import BeautifulSoup

import requests
import json
import os

from .security import require_auth
from . import api_rest

CURRENT_DIR = os.path.realpath(os.path.dirname(__file__))
CONSTANTS_DIR = os.path.join(CURRENT_DIR, "../../constants/")
url_list = json.load(open(os.path.join(CONSTANTS_DIR, "url_list.json")))


def parseContent(soup, urlInfo):
    posts = []
    for post in soup.select('#jwxe_main_content > div > div.list_wrap > table > tbody > tr'):
        try:
            title = post.find('td', class_='title_comm').a.text.strip()
            link = urlInfo['link'] + \
                post.find('td', class_='title_comm').a['href']
            posts.append({
                'unit': urlInfo['name'],
                'code': urlInfo['code'],
                'boardName': urlInfo['boardName'],
                'title': title,
                'link': link
            })
        except:
            pass
    return posts


def parseContentSW(soup, urlInfo):
    posts = []
    lists = soup.select('tr[height]:not([bgcolor])')
    for post in lists:
        try:
            print('shit')
            print(post)
            title = post.find('td', attrs={"align": "left"}).a.text.strip()
            link = 'http://software.ajou.ac.kr' + \
                post.find('td', attrs={"align": "left"}).a['href']
            posts.append({
                'unit': urlInfo['name'],
                'code': urlInfo['code'],
                'boardName': urlInfo['boardName'],
                'title': title,
                'link': link
            })
        except:
            pass
    return posts


class SecureResource(Resource):
    """ Calls require_auth decorator on all requests """
    method_decorators = [require_auth]


@api_rest.route('/notice/<string:code>')
class Bbansrun(Resource):
    def get(self, code):
        if (code == 'IT0004'):
            target = list(
                filter(lambda x: x['code'] == code, url_list['unsolved']))[0]
            res = requests.get(target['link'])
            res.encoding = 'euc-kr'
            return {
                'title': 'bbansrun',
                'message': '빤스런 프로젝트 아주나이스 - 아주대 차세대 학부 커뮤니티 서비스',
                'APIName': '/notice/<code>',
                'APIDescription': '본부대학급 공지사항 크롤러',
                'result': parseContentSW(BeautifulSoup(res.text, 'html.parser'), target)
            }
        if (code in list(map(lambda x: x['code'], url_list['resolved']))):
            target = list(
                filter(lambda x: x['code'] == code, url_list['resolved']))[0]
            return {
                'title': 'bbansrun',
                'message': '빤스런 프로젝트 아주나이스 - 아주대 차세대 학부 커뮤니티 서비스',
                'APIName': '/notice/<code>',
                'APIDescription': '본부대학급 공지사항 크롤러',
                'result': parseContent(BeautifulSoup(requests.get(target['link']).text, 'html.parser'), target)
            }
        else:
            return {
                'title': 'bbansrun',
                'message': '빤스런 프로젝트 아주나이스 - 아주대 차세대 학부 커뮤니티 서비스',
                'APIName': '/notice/<code>',
                'APIDescription': '본부대학급 공지사항 크롤러',
                'error': {
                    'message': 'Code not exists'
                }
            }


@api_rest.route('/resource/<string:resource_id>')
class ResourceOne(Resource):
    """ Unsecure Resource Class: Inherit from Resource """

    def get(self, resource_id):
        timestamp = datetime.utcnow().isoformat()
        return {'timestamp': timestamp}

    def post(self, resource_id):
        json_payload = request.json
        return {'timestamp': json_payload}, 201


@api_rest.route('/secure-resource/<string:resource_id>')
class SecureResourceOne(SecureResource):
    """ Unsecure Resource Class: Inherit from Resource """

    def get(self, resource_id):
        timestamp = datetime.utcnow().isoformat()
        return {'timestamp': timestamp}