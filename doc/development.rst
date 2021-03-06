===========
Development
===========


Communication channels
======================

Hang out on IRC and ask questions on ``#mailman`` or join the mailing list
``hyperkitty-devel@lists.fedorahosted.org``.


Setting up Hyperkitty for development
=====================================

The recommanded way to develop on HyperKitty is to use VirtualEnv. It will
create an isolated Python environment where you can add HyperKitty and its
dependencies without messing up your system Python install.

First, create the virtualenv and activate it::

    virtualenv venv_hk
    source venv_hk/bin/activate

Then download the components of HyperKitty::

    git clone https://github.com/hyperkitty/kittystore.git
    cd kittystore
    python setup.py develop
    cd ..
    git clone https://github.com/hyperkitty/hyperkitty.git
    cd hyperkitty
    python setup.py develop
    cd ..
    git clone https://github.com/hyperkitty/hyperkitty_standalone.git


.. Setting up the databases

.. include:: database.rst


Running HyperKitty
==================

If you're coding on HyperKitty, you can use Django's integrated web server.
It can be run with the following command::

    cd hyperkitty_standalone
    python manage.py runserver

.. warning::
    You should use the development server only locally. While it's possible to
    make your site publicly available using the dev server, you should never
    do that in a production environment.


Testing
=======

Use the following command::

    python hyperkitty_standalone/manage.py test hyperkitty

All test modules reside in the ``hyperkitty/tests`` directory
and this is where you should put your own tests, too. To make the django test
runner find your tests, make sure to add them to the folder's ``__init__.py``:
