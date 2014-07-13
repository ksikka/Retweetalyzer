import oauth2 as oauth
import urllib2 as urllib
import json
import pprint
import os

import cache

creds = json.load(open('creds.json'))

api_key = creds['api_key']
api_secret = creds['api_secret']
access_token_key = creds['access_token_key']
access_token_secret = creds['access_token_secret']

_debug = 0

oauth_token    = oauth.Token(key=access_token_key, secret=access_token_secret)
oauth_consumer = oauth.Consumer(key=api_key, secret=api_secret)

signature_method_hmac_sha1 = oauth.SignatureMethod_HMAC_SHA1()

http_method = "GET"


http_handler  = urllib.HTTPHandler(debuglevel=_debug)
https_handler = urllib.HTTPSHandler(debuglevel=_debug)

'''
Construct, sign, and open a twitter request
using the hard-coded credentials above.
'''
def twitterreq(url, method, parameters):
  req = oauth.Request.from_consumer_and_token(oauth_consumer,
                                             token=oauth_token,
                                             http_method=http_method,
                                             http_url=url,
                                             parameters=parameters)

  req.sign_request(signature_method_hmac_sha1, oauth_consumer, oauth_token)

  headers = req.to_header()

  if http_method == "POST":
    encoded_post_data = req.to_postdata()
  else:
    encoded_post_data = None
    url = req.to_url()

  print "URL: "+url
  opener = urllib.OpenerDirector()
  opener.add_handler(http_handler)
  opener.add_handler(https_handler)

  response = opener.open(url, encoded_post_data)

  return response

@cache.memoized('timeline_data')
def get_user_timeline(username):
  response_stream = twitterreq("https://api.twitter.com/1.1/statuses/user_timeline.json", "GET", {'screen_name':username})
  tweets = {'tweets': json.load(response_stream)}
  return tweets

def get_retweets(tweet_id_str):
  response_stream = twitterreq("https://api.twitter.com/1.1/statuses/retweets/%s.json" % tweet_id_str, "GET", {})
  retweets = {'retweets': json.load(response_stream)}
  return retweets

if __name__ == '__main__':
  # TODO check for weird injections

  # tweets = get_user_timeline('ibmrational')['tweets']
  # outfile = open('data.json', 'w')
  # json.dump(tweets, outfile)
  # print "stored in data.json"


  """
  tweets = json.load(open('data.json'))

  retweet_data = []

  for t in tweets:
      if not t['retweeted'] and t['retweet_count'] > 0:
          retweets = get_retweets(t['id_str'])['retweets']
          retweet_data.append(retweets)
      else:
          print "skipping..."

  outfile = open('retweet_data.json', 'w')
  json.dump(retweet_data, outfile)
  print "stored in retweet_data.json"
  """
