"""

Modified from https://wiki.python.org/moin/PythonDecoratorLibrary#Memoize

    Adapted to use couchdb for the cache backend

"""

import collections
import functools
import couchdb
import time

import os
if 'VCAP_SERVICES' in os.environ:
    couch_url = 'https://f2e77221-edde-41c2-a4d7-9f6943f832d7-bluemix.cloudant.com/' 
    couch = couchdb.Server(couch_url)
else:
    couch = couchdb.Server()

class memoized(object):
   '''Decorator. Caches a function's return value each time it is called.
   If called later with the same arguments, the cached value is returned
   (not reevaluated).
   '''
   def __init__(self, db_name):
      self.db_name = db_name

   def __call__(self, func):
      """Assumes the key is the first argument, and there's only one argument"""
      def wrappee(arg):
          key = arg

          try:
             cache = self.cache
          except AttributeError:
             self.cache = couch[self.db_name]
             cache = self.cache

          if key in cache:
             return cache[key]
          else:
             value = func(arg)
             value['cache_updated'] = int(time.time())
             value.update({'_id': key})
             cache.save(value)
             return value
      return wrappee

   def __repr__(self):
      '''Return the function's docstring.'''
      return self.func.__doc__

   def __get__(self, obj, objtype):
      '''Support instance methods.'''
      return functools.partial(self.__call__, obj)

if __name__ == "__main__":

    calls = 0

    if 'temp_test_cache' in couch:
        del couch['temp_test_cache']
    couch.create('temp_test_cache')

    @memoized('temp_test_cache')
    def test_fn(x):
        global calls
        calls += 1
        return {'number': x}

    val = test_fn('3')
    val2 = test_fn('3')

    print "Calls was %d, expected %d" % (calls, 1)
    print "Identity check: ", (val == val2 and val['number'] == '3')



